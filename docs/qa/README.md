# SupportDesk QA Test Reports & Execution Hub

Welcome to the dedicated Quality Assurance (QA) directory for the **SupportDesk** platform.

This directory houses all official QA audit reports, master test execution histories, and test artifact records generated across all application modules.

---

## 📁 Directory Structure

```text
docs/qa/
├── README.md                                      # Overview and testing guidelines (this file)
├── SupportDesk_Comprehensive_QA_Test_Report.md    # Latest full QA execution report (all 7 modules)
├── SupportDesk_Comprehensive_QA_Test_Report.docx  # Styled Word document version of the latest report
└── QA_TEST_RUN_HISTORY.md                         # Continuous historical log of all executed QA test runs
```

---

## 🚀 Running QA Tests & Updating Records

Whenever you run testing, the QA test runner automatically executes all 49 end-to-end test scenarios across all 7 modules and **writes the full audit results and updates the records in this folder automatically**.

### 1. Execute All Module Tests with Automated Report Logging
Run the comprehensive QA audit from the project root or API directory:

```bash
# From workspace root
npm --prefix apps/api run test:qa

# Or from apps/api directory
npm run test:qa
```

### What Happens Automatically When You Run `npm run test:qa`:
1. Launches an isolated in-process test server on port `3007`.
2. Connects to PostgreSQL and verifies all 7 modules:
   - **Module 1:** System Infrastructure & Security Headers
   - **Module 2:** Authentication & Authorization Security
   - **Module 3:** Ticket Lifecycle & CRUD Operations
   - **Module 4:** Role-Based Access Control (RBAC) & Anti-IDOR Tenant Isolation
   - **Module 5:** Ticket Comments & Confidential Internal Notes Isolation
   - **Module 6:** AI Features (Auto-Categorization & SSE Reply Streaming)
   - **Module 7:** AI Guardrails & Security Defenses (Length Limits, Delimiters, PII Masking, Moderation, Rate Limiting, Fallback)
   - **Module 8:** Administrator Operations & Soft Deletion
3. Re-generates and writes the latest records into:
   - `docs/qa/SupportDesk_Comprehensive_QA_Test_Report.md`
   - `docs/qa/SupportDesk_Comprehensive_QA_Test_Report.docx`
4. Appends a new timestamped summary entry with pass rate and metrics to:
   - `docs/qa/QA_TEST_RUN_HISTORY.md`

---

## 📊 Summary of Master Test Artifacts

| Report Artifact | Format | Description |
| :--- | :--- | :--- |
| [SupportDesk_Comprehensive_QA_Test_Report.md](./SupportDesk_Comprehensive_QA_Test_Report.md) | Markdown | Full test cases table (49 E2E cases), status codes, expected vs actual values, defect tracking & RCA log. |
| [SupportDesk_Comprehensive_QA_Test_Report.docx](./SupportDesk_Comprehensive_QA_Test_Report.docx) | Word Document | Executive-styled document with branded header banners, summary metrics table, and sign-off verdict. |
| [QA_TEST_RUN_HISTORY.md](./QA_TEST_RUN_HISTORY.md) | Markdown | Historical append-only log recording every test execution run, date/time, total tests, pass rate, and verdict. |

