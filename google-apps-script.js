// ============================================================
// StudyTrack — Google Apps Script v3
// doGet  → dashboard reads records via JSONP (callback param)
// doPost → student form writes a new record
//
// DEPLOY: Extensions → Apps Script → Deploy → New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
//
// Why JSONP? Apps Script does not send CORS headers compatible
// with cross-origin fetch(). The dashboard injects a <script>
// tag instead, and passes ?callback=fnName so the response is
// wrapped as: fnName({...data...})
// This is the standard pattern for calling Apps Script from
// an external page without a server proxy.
// ============================================================

const SHEET_NAME = "Submissions";

const COL = {
  TIMESTAMP:     1,
  NAME:          2,
  STUDY_HOURS:   3,
  ATTENDANCE:    4,
  SLEEP:         5,
  INTERNET:      6,
  GRADE:         7,
  NUMERIC_SCORE: 8,
};

// ── EXPORT HELPER ─────────────────────────────────────────
// Run this manually from the Apps Script editor whenever you
// want to update the dashboard with fresh data:
//   1. Open Apps Script → select exportData → click Run
//   2. Open Execution log (View → Logs)
//   3. Copy the JSON array
//   4. Paste it into dashboard.html replacing the RECORDS array
//   5. Update LAST_EXPORT date
//   6. git add dashboard.html && git commit && git push
function exportData() {
  const payload = buildPayload(getOrCreateSheet().getDataRange().getValues());
  Logger.log(JSON.stringify(payload.records, null, 2));
}

// ── GET: dashboard fetches all records (JSONP) ────────────
function doGet(e) {
  const callback = e.parameter.callback || null;

  try {
    const sheet = getOrCreateSheet();
    const rows  = sheet.getDataRange().getValues();

    const payload = rows.length <= 1
      ? { records: [], total: 0 }
      : buildPayload(rows);

    return output(payload, callback);

  } catch (err) {
    return output({ error: err.toString(), records: [], total: 0 }, callback);
  }
}

function buildPayload(rows) {
  const records = rows
    .slice(1)
    .map((row, i) => {
      const score = parseFloat(row[COL.NUMERIC_SCORE - 1]);
      return {
        id:           i + 1,
        studyHours:   safeFloat(row[COL.STUDY_HOURS   - 1]),
        attendance:   safeFloat(row[COL.ATTENDANCE    - 1]),
        sleep:        safeFloat(row[COL.SLEEP         - 1]),
        internet:     safeFloat(row[COL.INTERNET      - 1]),
        grade:        String(row[COL.GRADE - 1]).trim().toUpperCase(),
        numericScore: isNaN(score) ? null : score,
        // Student name deliberately excluded from API response
      };
    })
    .filter(r => ["A", "B", "C", "D", "F"].includes(r.grade));

  return { records, total: records.length };
}

// ── POST: student form writes a new record ────────────────
function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      data.timestamp    || new Date().toLocaleString(),
      (data.name        || "").trim(),
      safeFloat(data.studyHours),
      safeFloat(data.attendance),
      safeFloat(data.sleep),
      safeFloat(data.internet),
      String(data.grade || "").trim().toUpperCase(),
      data.numericScore !== "" ? safeFloat(data.numericScore) : "",
    ]);

    return output({ status: "ok" }, null);

  } catch (err) {
    return output({ status: "error", message: err.toString() }, null);
  }
}

// ── Helpers ───────────────────────────────────────────────

// If a callback name is provided, wrap JSON in callback(...)
// for JSONP. Otherwise return plain JSON (e.g. for direct browser test).
function output(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function safeFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function getOrCreateSheet() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "Timestamp", "Student Name / ID", "Study Hours / Week",
      "Attendance (%)", "Sleep Hours / Night",
      "Internet Usage (hrs/day)", "Final Grade", "Numeric Score",
    ];
    sheet.appendRow(headers);
    const hdr = sheet.getRange(1, 1, 1, headers.length);
    hdr.setBackground("#1a1a2e");
    hdr.setFontColor("#ffffff");
    hdr.setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 170);
  }

  return sheet;
}
