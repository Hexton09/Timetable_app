import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let scheduleFetchUrl = process.env.SCHEDULE_URL || "";
    let courseFetchUrl = process.env.COURSE_URL || "";

    if (!scheduleFetchUrl) {
      return res.status(400).json({
        error: "No timetable schedule URL environment variable (SCHEDULE_URL) is configured on the backend server. Please verify your Vercel Environment Variables."
      });
    }

    // Automatically handle a single standard Google Sheets link in SCHEDULE_URL!
    const googleSheetMatch = scheduleFetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (googleSheetMatch) {
      const spreadsheetId = googleSheetMatch[1];
      console.log(`[Backend Proxy] Auto-detected Google Sheet URL. Spreadsheet ID: ${spreadsheetId}`);
      scheduleFetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
      courseFetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=1069732703`;
    } else if (!courseFetchUrl) {
      return res.status(400).json({
        error: "A custom non-Google Sheet schedule URL was provided, but no COURSE_URL was configured. Please set up both SCHEDULE_URL and COURSE_URL on Vercel."
      });
    }

    console.log(`[Backend Proxy] Fetching Schedule from: ${scheduleFetchUrl}`);
    console.log(`[Backend Proxy] Fetching Course Mapping from: ${courseFetchUrl}`);

    // Fetch both CSV links
    const [scheduleRes, courseRes] = await Promise.all([
      fetch(scheduleFetchUrl).catch((err) => {
        throw new Error(`Failed to contact Schedule sheet server: ${err.message}`);
      }),
      fetch(courseFetchUrl).catch((err) => {
        throw new Error(`Failed to contact Course mapping sheet server: ${err.message}`);
      })
    ]);

    if (!scheduleRes.ok) {
      throw new Error(`Schedule sheet server returned error status: ${scheduleRes.status}`);
    }
    if (!courseRes.ok) {
      throw new Error(`Course mapping sheet server returned error status: ${courseRes.status}`);
    }

    const scheduleCsv = await scheduleRes.text();
    const courseCsv = await courseRes.text();

    return res.status(200).json({ scheduleCsv, courseCsv });
  } catch (error: any) {
    console.error("Vercel Serverless error proxying spreadsheet fetch:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while fetching external spreadsheet data."
    });
  }
}
