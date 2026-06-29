import type { VercelRequest, VercelResponse } from "@vercel/node";
import ExcelJS from "exceljs";

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
      scheduleFetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx&gid=0`;
      courseFetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=1069732703`;
    } else if (!courseFetchUrl) {
      return res.status(400).json({
        error: "A custom non-Google Sheet schedule URL was provided, but no COURSE_URL was configured. Please set up both SCHEDULE_URL and COURSE_URL on Vercel."
      });
    }

    console.log(`[Backend Proxy] Fetching Schedule from: ${scheduleFetchUrl}`);
    console.log(`[Backend Proxy] Fetching Course Mapping from: ${courseFetchUrl}`);

    // Fetch both links with cache busting
    const cacheBuster = `&t=${Date.now()}`;
    const [scheduleRes, courseRes] = await Promise.all([
      fetch(scheduleFetchUrl + (scheduleFetchUrl.includes('?') ? cacheBuster : `?${cacheBuster}`), { cache: 'no-store' }).catch((err) => {
        throw new Error(`Failed to contact Schedule sheet server: ${err.message}`);
      }),
      fetch(courseFetchUrl + (courseFetchUrl.includes('?') ? cacheBuster : `?${cacheBuster}`), { cache: 'no-store' }).catch((err) => {
        throw new Error(`Failed to contact Course mapping sheet server: ${err.message}`);
      })
    ]);

    if (!scheduleRes.ok) {
      throw new Error(`Schedule sheet server returned error status: ${scheduleRes.status}`);
    }
    if (!courseRes.ok) {
      throw new Error(`Course mapping sheet server returned error status: ${courseRes.status}`);
    }

    const courseCsv = await courseRes.text();

    // Parse Schedule as XLSX buffer to detect red background colors
    const scheduleBuffer = await scheduleRes.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(scheduleBuffer);
    const worksheet = workbook.worksheets[0];

    let scheduleCsv = "";
    
    let maxCols = 0;
    worksheet.eachRow((row) => {
      if (row.cellCount > maxCols) maxCols = row.cellCount;
    });

    worksheet.eachRow((row) => {
      const rowValues: string[] = [];
      for (let colNumber = 1; colNumber <= maxCols; colNumber++) {
        const cell = row.getCell(colNumber);
        // Handle rich text properly and safely extract value
        let cellValue = "";
        try {
          if (cell.type === ExcelJS.ValueType.Merge) {
            const master = cell.master;
            if (master && master.value) {
              cellValue = master.value.toString();
            }
          } else if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
            cellValue = cell.value.richText.map((rt: any) => rt.text).join("");
          } else if (cell.value !== null && cell.value !== undefined) {
            cellValue = cell.value.toString();
          }
        } catch(e) {
          cellValue = "";
        }
        
        // Check for red background fill
        if (cell.fill && cell.fill.type === 'pattern' && cell.fill.pattern === 'solid') {
          const fgColor = cell.fill.fgColor;
          let isRed = false;
          if (fgColor && fgColor.argb) {
            const hex = fgColor.argb.toUpperCase();
            if (hex.length === 8) {
              const r = parseInt(hex.substring(2, 4), 16);
              const g = parseInt(hex.substring(4, 6), 16);
              const b = parseInt(hex.substring(6, 8), 16);
              // Simple threshold for "red" (high red, low green and blue)
              if (r > 150 && g < 100 && b < 100) {
                isRed = true;
              }
            }
          }
          if (isRed && cellValue && cellValue !== 'LUNCH BREAK') {
             cellValue = `[CANCELLED] ${cellValue}`;
          }
        }
        
        // Escape for CSV
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
           cellValue = `"${cellValue.replace(/"/g, '""')}"`;
        }
        rowValues.push(cellValue);
      }
      scheduleCsv += rowValues.join(',') + '\n';
    });

    return res.status(200).json({ scheduleCsv, courseCsv });
  } catch (error: any) {
    console.error("Vercel Serverless error proxying spreadsheet fetch:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while fetching external spreadsheet data."
    });
  }
}
