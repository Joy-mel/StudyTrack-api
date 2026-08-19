// ============================================================
// StudyTrack — Google Apps Script Backend v2
// Handles both form submissions (doPost) and
// dashboard data retrieval (doGet).
//
// Deploy as: Web App → Execute as Me → Anyone can access
// ============================================================

const SHEET_NAME = "Submissions";

// Column indices (1-based, matching your sheet layout)
const COLS = {
  TIMESTAMP:     1,
  NAME:          2,
  STUDY_HOURS:   3,
  ATTENDANCE:    4,
  SLEEP:         5,
  INTERNET:      6,
  GRADE:         7,
  NUMERIC_SCORE: 8,
};

// ─── GET: Dashboard fetches all records ───────────────────
function doGet(e) {
  const headers = corsHeaders();

  try {
    const sheet = getOrCreateSheet();
    const rows  = sheet.getDataRange().getValues();

    if (rows.length <= 1) {
      // Only the header row — no data yet
      return respond({ records: [], total: 0 }, headers);
    }

    // Skip header row (index 0)
    const records = rows.slice(1).map((row, i) => {
      const numericScore = parseFloat(row[COLS.NUMERIC_SCORE - 1]);
      return {
        id:           i + 1,                                    // sequential, not a name
        timestamp:    String(row[COLS.TIMESTAMP - 1]),
        studyHours:   safeFloat(row[COLS.STUDY_HOURS   - 1]),
        attendance:   safeFloat(row[COLS.ATTENDANCE    - 1]),
        sleep:        safeFloat(row[COLS.SLEEP         - 1]),
        internet:     safeFloat(row[COLS.INTERNET      - 1]),
        grade:        String(row[COLS.GRADE            - 1]).trim().toUpperCase(),
        numericScore: isNaN(numericScore) ? null : numericScore,
        // NOTE: student name is deliberately excluded from the API
        // response to protect privacy in the dashboard.
      };
    }).filter(r => r.grade !== "");   // drop completely empty rows

    return respond({ records, total: records.length }, headers);

  } catch (err) {
    return respondError(err.toString(), headers);
  }
}

// ─── POST: Student form submits a new record ──────────────
function doPost(e) {
  const headers = corsHeaders();

  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      data.timestamp    || new Date().toLocaleString(),
      data.name         || "",
      safeFloat(data.studyHours),
      safeFloat(data.attendance),
      safeFloat(data.sleep),
      safeFloat(data.internet),
      String(data.grade || "").trim().toUpperCase(),
      data.numericScore !== "" ? safeFloat(data.numericScore) : "",
    ]);

    return respond({ status: "ok" }, headers);

  } catch (err) {
    return respondError(err.toString(), headers);
  }
}

// ─── Helpers ─────────────────────────────────────────────

function safeFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function respond(payload, headers) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function respondError(message, headers) {
  const output = ContentService
    .createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headerRow = [
      "Timestamp",
      "Student Name / ID",
      "Study Hours / Week",
      "Attendance (%)",
      "Sleep Hours / Night",
      "Internet Usage (hrs/day)",
      "Final Grade",
      "Numeric Score",
    ];
    sheet.appendRow(headerRow);

    const header = sheet.getRange(1, 1, 1, headerRow.length);
    header.setBackground("#1a1a2e");
    header.setFontColor("#ffffff");
    header.setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headerRow.length, 170);
  }

  return sheet;
}
