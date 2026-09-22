# SearchFix AI

AI-powered backend for analyzing SearchFix comments and identifying the issue types and document types required for further investigation.

## Overview

SearchFix is a workflow where a completed title/property search order is returned for correction based on comments or issues identified by the client or QC team.

SearchFix AI is being developed to assist this workflow by understanding the comments associated with an order, identifying the reported issue, and determining which document types may be required for the next stage of investigation.

The project is being developed incrementally, with document analysis and final SearchFix decisions planned for later stages.

---

## Current Workflow

The current workflow is:

Chrome Extension
        |
        | Order details + SearchFix comments
        v
SearchFix AI Backend
        |
        v
Express API
        |
        v
Gemini 3.5 Flash
        |
        +--> Understand comment history
        |
        +--> Identify issue type(s)
        |
        +--> Identify required document type(s)
        |
        v
Structured JSON Response
        |
        v
Chrome Extension

---

## Current Capabilities

The current Phase 1 implementation can:

- Receive SearchFix order information and comments as JSON.
- Process multiple comments associated with an order.
- Understand the comments as a timeline.
- Identify relevant SearchFix issue types.
- Identify document/file types required for further investigation.
- Return the analysis as structured JSON.
- Validate and parse the Gemini response before returning it.
- Provide an API endpoint that can be consumed by the Chrome Extension.

### Example Issue Types

Examples include:

- MISSING_DEED
- CHAIN_BREAK
- PARCEL_MISMATCH
- LEGAL_DESCRIPTION_MISMATCH
- TYPING_ERROR
- TAX_DISCREPANCY
- LIEN_DISCREPANCY
- COURT_DISCREPANCY
- BANKRUPTCY_DISCREPANCY
- VESTING_DISCREPANCY
- DEED_DISCREPANCY
- NAME_SEARCH_MISSING
- SEARCH_DEPTH
- MISSING_DOCUMENT
- WAITING_FOR_CLIENT
- WAITING_FOR_FEE_APPROVAL
- WAITING_FOR_COPIES
- OTHER

### Example Document Types

The system can identify document types such as:

- SEARCH_PACKAGE
- DEED
- DOT
- TAX
- PA
- LEGAL_DESCRIPTION
- MAP
- LIEN
- PACER
- PATRIOT
- TYPED_REPORT
- COST_WORKSHEET

---

## Current Stage

### Phase 1 - Comment Analysis and Document Selection

The project is currently focused only on the first stage of the SearchFix automation workflow.

Current flow:

1. Receive order number and SearchFix comments.
2. Send the comments to Gemini 3.5 Flash.
3. Understand the reported problem.
4. Identify the issue type or multiple issue types.
5. Determine the document types required for further investigation.
6. Return the result as structured JSON.

### What is NOT implemented yet

The current phase does not:

- Download documents from DataTrace.
- Open or analyze PDFs.
- Compare documents with client comments.
- Extract evidence from documents.
- Determine final Accepted/Rejected status.
- Update SearchFix status in DataTrace.
- Automatically complete the SearchFix task.

These capabilities are planned for future phases.

---

## Planned Future Workflow

The planned complete workflow is:

Chrome Extension
        |
        v
SearchFix Comments
        |
        v
Issue Classification
        |
        v
Required Document Selection
        |
        v
Document Retrieval
        |
        v
PDF / Document Analysis
        |
        v
Evidence Extraction
        |
        v
Compare Client Claim
with Search Package / Documents
        |
        v
SearchFix Decision
        |
        +--> Accepted
        |
        +--> Rejected
        |
        +--> Review
        |
        v
DataTrace Update

---

## Architecture

### Current Architecture

- Node.js
- Express.js
- JavaScript ES Modules
- Gemini 3.5 Flash
- Google GenAI SDK
- dotenv
- CORS

### Planned Components

Future stages may include:

- Chrome Extension integration
- Document retrieval
- PDF/document processing
- Evidence extraction
- Search package analysis
- Automated SearchFix decision logic
- DataTrace workflow integration

---

## Project Structure

```text
searchfix-ai/
│
├── src/
│   ├── server.js
│   │
│   ├── routes/
│   │   └── searchfix.routes.js
│   │
│   ├── controllers/
│   │   └── searchfix.controller.js
│   │
│   ├── services/
│   │   └── gemini.service.js
│   │
│   ├── prompts/
│   │   └── searchfix.prompt.js
│   │
│   └── utils/
│       ├── issueTypes.js
│       └── responseValidator.js
│
├── tests/
│   └── searchfix.test.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md