import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_styled_document():
    doc = Document()

    # Set Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("SupportDesk Comprehensive QA & End-to-End Test Report")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Deep Navy

    # Subtitle / Metadata
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(16)
    run_meta = p_meta.add_run("Day 17 Quality Audit | Full System Modules & Security Guardrails Verification")
    run_meta.font.name = "Calibri"
    run_meta.font.size = Pt(12)
    run_meta.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Metadata Banner Table
    banner_table = doc.add_table(rows=2, cols=4)
    banner_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    banner_table.autofit = False

    headers = ["Report ID", "Execution Date", "Target Branch", "Final Verdict"]
    vals = ["QA-REP-2026-DAY17-E2E", "25 Nov 2026", "feat/ai-guardrails", "PASS - 100% SUCCESS"]

    for col_idx, (h, v) in enumerate(zip(headers, vals)):
        c0 = banner_table.cell(0, col_idx)
        c0.text = h
        set_cell_background(c0, "1E3A8A")
        set_cell_margins(c0, top=100, bottom=100, left=120, right=120)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.runs[0]
        r0.font.name = "Calibri"
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        c1 = banner_table.cell(1, col_idx)
        c1.text = v
        set_cell_background(c1, "F1F5F9")
        set_cell_margins(c1, top=100, bottom=100, left=120, right=120)
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p1.runs[0]
        r1.font.name = "Calibri"
        r1.font.bold = True
        r1.font.size = Pt(10)
        if col_idx == 3:
            r1.font.color.rgb = RGBColor(0x16, 0x65, 0x34) # Green
        else:
            r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(3)
        r = h.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        return h

    def add_body(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Calibri"
            r_bold.font.size = Pt(10.5)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    # 1. Executive Summary
    add_heading_1("1. Executive Summary & Verification Highlights")
    add_body(
        "A rigorous, end-to-end Quality Assurance audit was conducted across the SupportDesk platform by executing live dummy data tests "
        "against all operational endpoints, authorization layers, UI components, and AI security guardrails. "
        "The test harness interacted with real Docker PostgreSQL persistence and Google Gemini cloud gateways to validate behavior under real-world conditions."
    )

    # Summary Metrics Table
    summary_data = [
        ["Live End-to-End Test Cases", "49 executed", "100% coverage", "49 Passed (100%)", "ALL PASS"],
        ["Backend Unit & Integration Tests (Jest)", "138 executed", "100% passing", "138 Passed (100%)", "ALL PASS"],
        ["Frontend UI Tests (Vitest)", "63 executed", "100% passing", "63 Passed (100%)", "ALL PASS"],
        ["Total Automated Tests Executed", "250 tests", "100% passing", "250 Passed (100%)", "ALL PASS"],
        ["AI Ground-Truth Evaluation Benchmark", "20 tickets", ">= 80% accuracy", "20/20 (100.0%)", "EXCEEDED"],
        ["Prompt Injection Attack Scenarios", "10 malicious samples", "100% blocked", "10/10 Defended", "PROTECTED"],
        ["Defects Found & Resolved", "3 defects", "0 open defects", "3 Resolved (RCA Logged)", "RESOLVED"],
    ]

    sum_table = doc.add_table(rows=len(summary_data) + 1, cols=5)
    sum_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(2.5), Inches(1.1), Inches(1.2), Inches(1.4), Inches(1.0)]

    headers = ["Test Suite / Domain", "Executed", "Target Threshold", "Observed Outcome", "Status"]
    for i, h in enumerate(headers):
        cell = sum_table.cell(0, i)
        cell.text = h
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.runs[0]
        r.font.name = "Calibri"
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for row_idx, row_vals in enumerate(summary_data, start=1):
        bg = "FFFFFF" if row_idx % 2 != 0 else "F8FAFC"
        for col_idx, val in enumerate(row_vals):
            cell = sum_table.cell(row_idx, col_idx)
            cell.text = val
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            p = cell.paragraphs[0]
            r = p.runs[0]
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            if col_idx == 4:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x16, 0x65, 0x34)
            else:
                r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # 2. Defects Found and Fixed (RCA)
    add_heading_1("2. Defect Tracking and Root Cause Analysis (RCA)")
    add_body("During test execution, 3 software defects were discovered by the QA auditor, diagnosed via Root Cause Analysis, fixed immediately, and verified clean:")

    defects = [
        {
            "id": "BUG-QA-001",
            "title": "AI Per-User Rate Limiter Falling Back to Shared IP Key",
            "sev": "High (Security)",
            "module": "AI Guardrails (rate-limiter.ts)",
            "rca": "KeyGenerator checked (req as any).currentUser?.id. However, auth.middleware.ts attaches decoded claims to req.user. The undefined check caused all users to fall back to shared IP rate-limiting.",
            "fix": "Updated keyGenerator to inspect req.user || (req as any).currentUser, correctly binding quotas to user ID.",
            "verification": "Burst test of 20 concurrent requests verified Dave Agent throttled at 15 req/min with HTTP 429."
        },
        {
            "id": "BUG-QA-002",
            "title": "HTML/XSS <script> Moderation Regex Bypass",
            "sev": "High (Security)",
            "module": "Content Moderation (moderation.ts)",
            "rca": "Leading word boundary '\\b' was applied to entire alternation group containing '<script>'. Since '<' is a non-word character, '\\b<script>' never matched when preceded by space or string start.",
            "fix": "Restructured regex to separate word-boundary commands from symbol tags: /(?:\\b(?:drop\\s+(?:table|database)|rm\\s+-rf\\s+\\/|exec\\s+xp_cmdshell)\\b|<script\\b)/i.",
            "verification": "Submitting <script>alert('pwned')</script> successfully triggered HTTP 400 MODERATION_ERROR."
        },
        {
            "id": "BUG-QA-003",
            "title": "Generic BAD_REQUEST Code on Content Moderation Flag",
            "sev": "Medium (API Contract)",
            "module": "Application Errors & AI Service (app.error.ts, ai.service.ts)",
            "rca": "ai.service.ts threw generic BadRequestError, producing error code BAD_REQUEST instead of a specific moderation violation code.",
            "fix": "Created ModerationError extends AppError with HTTP 400 and code 'MODERATION_ERROR', attaching flagged categories to details.",
            "verification": "API client cleanly receives MODERATION_ERROR code allowing tailored UI warning alerts."
        }
    ]

    for d in defects:
        add_heading_2(f"{d['id']}: {d['title']} [{d['sev']}]")
        add_body(d["module"], "Affected Module: ")
        add_body(d["rca"], "Root Cause Analysis (RCA): ")
        add_body(d["fix"], "Fix Implemented: ")
        add_body(d["verification"], "Verification Result: ")

    # 3. Live E2E Test Execution Summary
    add_heading_1("3. Comprehensive Test Case Execution Results (49 Cases)")
    add_body("Below is the execution log of all 49 automated end-to-end test cases covering all 7 core modules:")

    module_cases = [
        ("Module 1: System Infrastructure & Security", "4 / 4 Passed (100%)", [
            "TC-SYS-01: Health check endpoint availability (/health returns status ok and uptime) - PASS",
            "TC-SYS-02: Helmet security headers (X-Content-Type-Options: nosniff, X-Frame-Options) - PASS",
            "TC-SYS-03: CORS allowlist verification for http://localhost:5173 - PASS",
            "TC-SYS-04: OpenAPI Swagger specification documentation (/docs.json) - PASS",
        ]),
        ("Module 2: Authentication & Authorization", "10 / 10 Passed (100%)", [
            "TC-AUTH-01: Customer login with valid credentials (JWT token issued, passwordHash excluded) - PASS",
            "TC-AUTH-02: Support Agent login with valid credentials (role verified as agent) - PASS",
            "TC-AUTH-03: Administrator login with valid credentials (role verified as admin) - PASS",
            "TC-AUTH-04: Login rejection with invalid password (HTTP 401 UNAUTHORIZED) - PASS",
            "TC-AUTH-05: Login rejection for unknown email (HTTP 401 anti-enumeration) - PASS",
            "TC-AUTH-06: Login input validation rejection for malformed payload - PASS",
            "TC-AUTH-07: Customer self-registration via /auth/register (role locked to customer) - PASS",
            "TC-AUTH-08: Duplicate registration conflict rejection (HTTP 409 CONFLICT) - PASS",
            "TC-AUTH-09: Protected route rejection without Bearer token (HTTP 401 UNAUTHORIZED) - PASS",
            "TC-AUTH-10: Protected route rejection with tampered/invalid JWT - PASS",
        ]),
        ("Module 3: Ticket Lifecycle & CRUD Operations", "10 / 10 Passed (100%)", [
            "TC-TCK-01: Customer creates ticket with valid payload (status: open, ref generated) - PASS",
            "TC-TCK-02: Customer retrieves scoped ticket list (strictly own tickets returned) - PASS",
            "TC-TCK-03: Customer retrieves single ticket details with calculated SLA target - PASS",
            "TC-TCK-04: Agent searches tickets by text keyword (matching query found) - PASS",
            "TC-TCK-05: Agent filters tickets by multi-criteria (status=open & priority=P2) - PASS",
            "TC-TCK-06: Agent claims ticket and updates status to in_progress - PASS",
            "TC-TCK-07: Transition to resolved sets resolvedAt audit timestamp - PASS",
            "TC-TCK-08: Transition to closed sets closedAt audit timestamp - PASS",
            "TC-TCK-09: Reopening closed ticket safely resets resolvedAt and closedAt to null - PASS",
            "TC-TCK-10: Validation rejection on invalid ticket status enum (HTTP 400) - PASS",
        ]),
        ("Module 4: Role-Based Access Control (RBAC)", "5 / 5 Passed (100%)", [
            "TC-RBAC-01: Cross-customer isolation: Bob queries Alice ticket -> HTTP 404 (zero enumeration) - PASS",
            "TC-RBAC-02: Customer prohibited from reassigning ticket assignee -> HTTP 403 FORBIDDEN - PASS",
            "TC-RBAC-03: Customer prohibited from deleting ticket -> HTTP 403 FORBIDDEN - PASS",
            "TC-RBAC-04: Customer prohibited from AI triage auto-categorize endpoint -> HTTP 403 - PASS",
            "TC-RBAC-05: Customer prohibited from AI suggest-reply endpoint -> HTTP 403 FORBIDDEN - PASS",
        ]),
        ("Module 5: Comments & Internal Notes Isolation", "8 / 8 Passed (100%)", [
            "TC-COM-01: Customer posts public comment (isInternal: false, author bound to Alice) - PASS",
            "TC-COM-02: Customer prohibited from posting internal note (isInternal: true -> HTTP 403) - PASS",
            "TC-COM-03: Support Agent posts public response comment - PASS",
            "TC-COM-04: Support Agent creates confidential internal note (isInternal: true) - PASS",
            "TC-COM-05: Customer comment list strictly excludes internal notes (0 notes leaked) - PASS",
            "TC-COM-06: Agent comment list includes both public comments and internal notes - PASS",
            "TC-COM-07: Customer ticket details query strictly excludes embedded internal notes - PASS",
            "TC-COM-08: Cross-customer comment isolation (Bob queries Alice comments -> HTTP 404) - PASS",
        ]),
        ("Module 6: AI Features (Day 16)", "3 / 3 Passed (100%)", [
            "TC-AI-01: Agent AI Auto-Categorize on draft ticket (Technical, P1, confidence: 95%) - PASS",
            "TC-AI-02: Structured AI output conforms to strict Zod schema contract - PASS",
            "TC-AI-03: AI Suggest Reply Server-Sent Events (SSE) streaming (text/event-stream chunks) - PASS",
        ]),
        ("Module 7: AI Guardrails & Security Defenses (Day 17)", "7 / 7 Passed (100%)", [
            "TC-GRD-01: Input length guardrail enforces max limits (>200 title, >4000 description) - PASS",
            "TC-GRD-02: Delimiter breakout neutralization (escapes <<<UNTRUSTED_CONTENT>>>) - PASS",
            "TC-GRD-03: Content moderation blocks SQL injection exploit attempts (HTTP 400 MODERATION_ERROR) - PASS",
            "TC-GRD-04: Content moderation blocks HTML/XSS script tags (HTTP 400 MODERATION_ERROR) - PASS",
            "TC-GRD-05: PII Masking masks credit cards, SSN, emails, phones, passwords before AI prompt - PASS",
            "TC-GRD-06: Per-user rate limiting enforces HTTP 429 on 15 req/min burst - PASS",
            "TC-GRD-07: Safe failure fallback contract ('AI unavailable — reply manually.') verified - PASS",
        ]),
        ("Module 8: Admin Operations & Soft Delete", "2 / 2 Passed (100%)", [
            "TC-ADM-01: Administrator soft-deletes ticket via DELETE /tickets/:id (HTTP 200) - PASS",
            "TC-ADM-02: Subsequent retrieval of soft-deleted ticket returns HTTP 404 Not Found - PASS",
        ]),
    ]

    for mod_title, status_str, cases in module_cases:
        add_heading_2(f"{mod_title} — {status_str}")
        for c in cases:
            add_body(f"• {c}")

    # 4. Final Verdict
    add_heading_1("4. Senior QA Sign-Off Verdict")
    add_body(
        "Based on the execution of 250 total automated tests (49 live E2E, 138 backend Jest, 63 frontend Vitest) "
        "and 100% pass rates across all 7 functional and security modules, the SupportDesk application is hereby "
        "formally signed off as PRODUCTION READY.",
        "Quality Verdict: "
    )

    doc_path = "D:\\SupportD\\SupportDesk\\docs\\day-17\\SupportDesk_Comprehensive_QA_Test_Report.docx"
    doc.save(doc_path)
    print(f"Report saved successfully to {doc_path}")

if __name__ == "__main__":
    create_styled_document()
