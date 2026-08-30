# StudyTrack

**Student Form:** https://jm-studytrack.netlify.app/ &nbsp;|&nbsp; **Dashboard:** https://jm-studytrack.netlify.app/dashboard.html &nbsp;|&nbsp

A student academic performance data collection and analytics system. Students submit study habits via a form; the instructor views aggregated patterns on a private dashboard — both connected through a Google Apps Script API backed by Google Sheets.

Built as a portfolio project for a Junior Software Engineer application, demonstrating end-to-end data engineering, API design, and frontend data visualisation.

---

## Architecture

```
student-form (index.html)
        │
        │  POST JSON
        ▼
Google Apps Script (google-apps-script.js)
        │                   │
        │  appendRow()      │  getDataRange()
        ▼                   ▼
   Google Sheets ──────────────────► dashboard (dashboard.html)
   "Submissions" tab                      │
                                          │ Chart.js visualisations
                                          ▼
                                     Instructor only
```

No backend server. No database to maintain. Google Apps Script acts as a free, serverless API layer. All files are static and deploy to Netlify in one drag-and-drop.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Student-facing data entry form. Submits via POST. No records view — students cannot see other submissions. |
| `dashboard.html` | Analytics dashboard (instructor-only). Fetches live data from Apps Script `doGet`, processes it client-side, renders Chart.js charts and KPI cards. |
| `google-apps-script.js` | Serverless API. Handles `doPost` (form writes) and `doGet` (dashboard reads). Strips student names from API responses. |
| `README.md` | This file. |

---

## Data Schema

Sheet: **Submissions** (auto-created on first POST if it doesn't exist)

| Column | Type | Notes |
|--------|------|-------|
| Timestamp | String | Set at submission time |
| Student Name / ID | String | Stored in Sheets; **excluded from doGet response** |
| Study Hours / Week | Number | 0 – 80 |
| Attendance (%) | Number | 0 – 100 |
| Sleep Hours / Night | Number | 2 – 14 |
| Internet Usage (hrs/day) | Number | 0 – 18 |
| Final Grade | String | A / B / C / D / F |
| Numeric Score | Number (optional) | 0 – 100 |

---

## Setup

### 1. Google Sheets
Create a new spreadsheet. Leave the first sheet tab as-is — the script names it `Submissions` automatically.

### 2. Apps Script (critical — do this first)

1. Open the sheet → **Extensions → Apps Script**
2. Delete the default code; paste the full contents of `google-apps-script.js`
3. Save the project (`Ctrl+S`)
4. **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** → authorise → copy the `/exec` URL

> ⚠️ Every time you update the script, create a **new deployment** — Apps Script caches old versions.

### 3. Wire up the frontend

Both HTML files already contain the deployed URL for this project. If you redeploy the script and get a new URL, update this line in both files:

**`index.html`** (around line 368):
```js
const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ID/exec";
```

**`dashboard.html`** (near top of `<script>`):
```js
const API_URL = "https://script.google.com/macros/s/YOUR_ID/exec";
```

### 4. Deploy to Netlify

1. Go to [netlify.com/drop](https://netlify.com/drop)
2. Drag the project folder in — or push to GitHub and connect the repo
3. Netlify serves `index.html` at the root automatically

> Share only the form URL with students. Bookmark `dashboard.html` for yourself.

---

## Dashboard Visualisations

All charts compute from the live dataset at load time. No hardcoded values anywhere.

| Chart | What it shows |
|-------|--------------|
| Students per grade | Count distribution across A–F |
| Avg numeric score by grade | Mean score for students who reported one |
| Study hours / week by grade | Avg weekly study time per grade group |
| Attendance by grade | Avg attendance rate per grade group |
| Sleep hours / night by grade | Avg nightly sleep per grade group |
| Internet usage / day by grade | Avg daily online hours per grade group |
| Study hours vs score (scatter) | Individual points coloured by grade |

Each chart includes an auto-generated insight derived from the actual data, not hardcoded text.

**Interpretation:** Charts show associations in the collected sample. Correlation ≠ causation.

---

## Engineering Practices

| Practice | Implementation |
|----------|---------------|
| Separation of concerns | `fetchRecords()`, `validateRecords()`, `processRecords()`, and each `render*()` are isolated functions with single responsibilities |
| Data validation | Every API record is type-checked and filtered before reaching any chart |
| Error handling | Network errors, empty datasets, and API failures each produce distinct, actionable UI states |
| Chart lifecycle | `makeChart()` destroys the previous Chart.js instance before creating a new one — no canvas reuse errors on refresh |
| Privacy | Student names stored in Sheets; excluded from API responses; dashboard never receives or displays names |
| No mock data | Dashboard shows an error state if data cannot load — it never falls back to fabricated records |
| Responsive | CSS Grid with breakpoints; works on mobile |
| No build step | Vanilla HTML/CSS/JS — clone and open, no `npm install` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Form & dashboard | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.4 (CDN) |
| API | Google Apps Script (serverless, free) |
| Database | Google Sheets |
| Fonts | Syne, DM Mono, DM Sans (Google Fonts) |
| Hosting | Netlify (static) |

---

## Local Development

```bash
# Python 3 — serves all files including dashboard.html
python -m http.server 8080

# Then open:
# http://localhost:8080/           ← student form
# http://localhost:8080/dashboard.html  ← dashboard
```

CORS is handled by Apps Script's response headers. No proxy needed locally.

---

## Author

**Joy Melvine Okinyi** — Data Science & Analytics Student, JKUAT Karen Campus  
KamiLimu Cohort 10 · Co-founder, Bring Hope Foundation · GDSC JKUAT
