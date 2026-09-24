# SearchFix AI — Issue Classification, Document Analysis & Decision System

> **Version**: Phase 2 — Comment Understanding, PDF Document Analysis & Evidence-Based Decision System  
> **Built with**: Node.js, Express, ES Modules, `@google/genai` (Gemini 3.5 Flash), Multer, Zod

---

## 📌 Phase 2 System Overview

**SearchFix AI Phase 2** extends the issue classification capability of Phase 1 into a full **evidence-based decision engine**.

Rather than relying purely on text comments or guessing outcomes, Phase 2 implements a 7-stage processing pipeline:

```text
Order + Comments + Uploaded PDFs
              │
              ▼
[1] Express Endpoint & Multer File Upload (POST /api/searchfix/analyze)
              │
              ▼
[2] Comment Selection (User classification, timeline sorting, SUSPEND traversal, duplicate filtering)
              │
              ▼
[3] Issue Classification (Gemini natural language multi-issue detection)
              │
              ▼
[4] Document Selection (Rule-based mapping: Issue ➔ Required Document Types)
              │
              ▼
[5] Target PDF Document Analysis (Filters uploaded PDFs ➔ Gemini Files API upload)
              │
              ▼
[6] Evidence Extraction (Page-numbered findings, quoted text, confidence score)
              │
              ▼
[7] Decision Engine (Claim vs Evidence comparison ➔ ACCEPTED / DISPUTED / REVIEW_REQUIRED)
```

---

## 🛠 Technology Stack

- **Runtime**: Node.js (v18+ recommended)
- **Framework**: Express.js (`"type": "module"`)
- **AI SDK**: `@google/genai` (Official Google Gen AI SDK with Files API support)
- **Model**: `gemini-2.5-flash` / `gemini-1.5-flash` (configurable)
- **File Uploads**: `multer` (multipart/form-data upload handling)
- **Validation**: `zod` + custom response validator

---

## 📂 Modular Architecture & Directory Structure

```
searchfix-ai/
│
├── src/
│   ├── server.js                        # Express server entry point & middleware
│   ├── routes/
│   │   └── searchfix.routes.js          # API endpoints (/analyze & /analyze-comments)
│   ├── controllers/
│   │   └── searchfix.controller.js      # Controller handling multipart uploads & 7-stage pipeline
│   ├── services/
│   │   ├── gemini.service.js            # Low-level Gemini API calls (generateJSON, Files API upload/delete)
│   │   ├── commentSelection.service.js  # User classification, timeline sorting & SUSPEND traversal
│   │   ├── issueClassification.service.js # Multi-issue semantic classification
│   │   ├── documentSelection.service.js   # Rule-based document mapping
│   │   ├── documentAnalysis.service.js    # PDF uploading & evidence extraction via Gemini Files API
│   │   ├── evidence.service.js            # Evidence structuring & page-traceability
│   │   └── decision.service.js            # Claim vs Evidence comparison -> ACCEPTED / DISPUTED / REVIEW_REQUIRED
│   ├── prompts/
│   │   ├── commentAnalysis.prompt.js      # System prompt for issue extraction
│   │   ├── documentAnalysis.prompt.js     # System prompt for PDF evidence extraction
│   │   └── decision.prompt.js             # System prompt for claim vs evidence comparison
│   ├── config/
│   │   ├── users.js                       # User classification rules (INTERNAL, CLIENT, SYSTEM)
│   │   ├── issueTypes.js                  # 18 Whitelisted ISSUE_TYPES
│   │   └── documentMappings.js            # 13 Whitelisted DOCUMENT_TYPES & issue-to-doc mappings
│   ├── schemas/
│   │   ├── comment.schema.js              # Order input validation schema
│   │   ├── document.schema.js             # Upload metadata schema
│   │   └── result.schema.js               # Output response Zod validation schema
│   └── utils/
│       ├── normalizeComment.js            # Text normalization
│       ├── duplicateDetector.js           # Duplicate comment filtering & WFID merging
│       └── responseValidator.js           # Deterministic category guard
│
├── tests/
│   ├── commentSelection.test.js          # Timeline & user classification tests
│   ├── decision.test.js                # Decision engine tests
│   └── searchfix.test.js                # Full unit & regression test suite (Orders 1-8)
│
├── sample-data/
│   └── orders.json                      # PRD Orders 1-8 regression test datasets
│
├── .env                                 # Local environment variables
├── .env.example                         # Template environment variables
├── package.json                         # Node package configuration
└── README.md                            # Comprehensive documentation
```

---

## 📡 API Endpoints

### 1. Full Phase 2 Analysis (`POST /api/searchfix/analyze`)

- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `orderData`: JSON string containing `orderNumber`, `borrower`, `location`, `comments` array.
  - `file1`, `file2`, etc.: Uploaded PDF document files.
  - `fileType_file1` (optional): Override document type string (e.g., `"DEED"`, `"TAX"`, `"SEARCH_PACKAGE"`).

#### Sample Phase 2 Response Output:
```json
{
  "orderNumber": "TPS-AD-101-10926679",
  "commentAnalysis": {
    "selectedComment": {
      "date": "2026-09-21",
      "time": "05:20",
      "author": "RVSI-Outsource: Pjayaram_FAI",
      "role": "CLIENT",
      "text": "In mtg borrower showing as John Mccutcheon missed to run name search in pacer, patriot, TA and typing module."
    },
    "contextCommentsUsed": [
      {
        "date": "2026-09-21",
        "time": "05:20",
        "author": "OWLServiceUser",
        "role": "SYSTEM",
        "text": "SUSPEND: Product [Full Title]",
        "purpose": "workflow_suspend_state"
      }
    ]
  },
  "issues": [
    {
      "issueType": "NAME_SEARCH_MISSING",
      "clientClaim": "In mtg borrower showing as John Mccutcheon missed to run name search in pacer, patriot, TA and typing module.",
      "requiredDocuments": ["PACER", "PATRIOT", "TYPED_REPORT", "SEARCH_PACKAGE"],
      "evidence": [],
      "decision": "REVIEW_REQUIRED",
      "reason": "Required supporting document(s) [PACER, PATRIOT, TYPED_REPORT, SEARCH_PACKAGE] were not provided for analysis."
    }
  ],
  "overallDecision": "REVIEW_REQUIRED"
}
```

### 2. Backwards-Compatible Phase 1 Endpoint (`POST /api/searchfix/analyze-comments`)

- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**: JSON containing `orderNumber` and `comments` array. Returns issue types & required files list.

---

## ⚡ Decision Engine Rules

1. **`ACCEPTED`**: The claim is confirmed by document evidence showing that search/reporting work was missing, incorrect, or inconsistent.
2. **`DISPUTED`**: The document evidence contradicts or fails to support the reported error.
3. **`REVIEW_REQUIRED`**: Required supporting document(s) were not provided or evidence is inconclusive, requiring manual human review.

---

## 🧪 Running Tests

To run the complete test suite (unit tests + Orders 1-8 regression test datasets):

```bash
npm test
```
