import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch CSV from env-configured Google Sheets URLs
  app.get("/api/timetable", async (req, res) => {
    try {
      let scheduleFetchUrl = process.env.SCHEDULE_URL || "";
      let courseFetchUrl = process.env.COURSE_URL || "";

      if (!scheduleFetchUrl) {
        return res.status(400).json({
          error: "No timetable schedule URL environment variable (SCHEDULE_URL) is configured on the backend server. Please verify your .env setup."
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
          error: "A custom non-Google Sheet schedule URL was provided, but no COURSE_URL was configured. Please set up both SCHEDULE_URL and COURSE_URL in your .env file."
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

      res.json({ scheduleCsv, courseCsv });
    } catch (error: any) {
      console.error("Backend error proxying spreadsheet fetch:", error);
      res.status(500).json({
        error: error.message || "An error occurred while fetching external spreadsheet data."
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup for asset serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
