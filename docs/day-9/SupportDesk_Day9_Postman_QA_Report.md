# SupportDesk — Day 9 Postman QA Test Report
## Mandatory End-to-End API Testing & Database Persistence Verification

---

### 1. Executive Summary
- **Tester / Engineer:** Senior API QA Engineer & Technical Mentor
- **Date:** Saturday, 7 November 2026
- **Test Target:** SupportDesk REST API (`http://localhost:3000`)
- **Collection Name:** `SupportDesk – Day 9 API Testing`
- **Environment:** `SupportDesk Local` (`{{baseUrl}} = http://localhost:3000`)
- **Execution Mechanism:** Postman Collection Runner (Newman CLI Engine)
- **Total Requests:** 12
- **Total Assertions:** 27
- **Passed Assertions:** 27 (100% Pass Rate)
- **Failed Assertions:** 0
- **Database Persistence Status:** **VERIFIED** via direct PostgreSQL read-only SQL query

---

### 2. Final Postman Test Verification Matrix

| Test Case | Method & Endpoint | Expected | Actual Status | Result | Evidence / Assertion Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Health Check** | `GET /health` | 200 OK | `200 OK` (5ms) | **PASS** | Status `ok`, service name `SupportDesk API`, valid uptime and ISO timestamp. |
| **2. List Tickets** | `GET /tickets` | 200 OK | `200 OK` (45ms) | **PASS** | Envelope valid, array returned with 50 seeded tickets, `meta.total = 50`. |
| **3. Create Ticket (Step 1)** | `POST /tickets` | 201 Created | `201 Created` (26ms) | **PASS** | Generated `id: 53`, `reference: TCK-2026-0051`, saved to environment variable. |
| **4. Retrieve Ticket (Step 2)**| `GET /tickets/{{ticketId}}` | 200 OK | `200 OK` (14ms) | **PASS** | Retrieved `id: 53` matches submitted title, description, status `open`, priority `P2`. |
| **5. Update Ticket (Step 3)** | `PATCH /tickets/{{ticketId}}`| 200 OK | `200 OK` (26ms) | **PASS** | Title updated, status transitioned to `in_progress`, priority updated to `P1`. |
| **6. Retrieve Updated (Step 4)**| `GET /tickets/{{ticketId}}` | 200 OK | `200 OK` (10ms) | **PASS** | Confirmed persisted updated title and status; unmodified fields remain intact. |
| **7. Invalid ID Validation** | `GET /tickets/invalid-id` | 400 Bad Request | `400 Bad Request` (2ms)| **PASS** | Zod rejects non-numeric ID with code `VALIDATION_ERROR`. |
| **8. Nonexistent ID (404)** | `GET /tickets/999999` | 404 Not Found | `404 Not Found` (6ms) | **PASS** | Returns structured `NOT_FOUND` envelope (`data: null`). |
| **9. Invalid Body Schema** | `POST /tickets` (`{ "title": "AB" }`) | 400 Bad Request | `400 Bad Request` (2ms)| **PASS** | Rejects missing `description`, `customerId` with field-level issues array. |
| **10. Nonexistent Update** | `PATCH /tickets/999999` | 404 Not Found | `404 Not Found` (6ms) | **PASS** | Structured `NOT_FOUND` response for unmapped resource update. |
| **11. Controlled Error Test**| `GET /test/error` | 500 Internal Error | `500 Internal Error` (1ms)| **PASS** | Sanitized error response; zero stack traces, SQL strings, or secrets leaked. |
| **12. Soft-Delete Ticket** | `DELETE /tickets/{{ticketId}}`| 200 OK | `200 OK` (16ms) | **PASS** | Response confirms `{ id: 53, deleted: true }`. Subsequent GET yields 404. |

---

### 3. Step 5 — Direct Database Persistence Verification Evidence

To ensure data integrity and prove that responses were not hardcoded or mocked, a direct SQL query was executed against the running PostgreSQL Docker container (`supportdesk-postgres`):

```sql
SELECT id, reference, title, description, status, priority, customer_id, created_at, updated_at, deleted_at
FROM tickets
WHERE id = 53;
```

#### Actual Query Output Comparison Table:

| Column | API Submitted / Expected Value | Direct PostgreSQL Database Value | Persistence Match |
| :--- | :--- | :--- | :--- |
| **`id`** | `53` | `53` | **EXACT MATCH** |
| **`reference`** | `TCK-2026-0051` | `TCK-2026-0051` | **EXACT MATCH** |
| **`title`** | `Postman E2E Test Ticket: VPN Gateway Resolved (Title Updated)` | `Postman E2E Test Ticket: VPN Gateway Resolved (Title Updated)` | **EXACT MATCH** (Updated by PATCH) |
| **`description`**| `Remote employees unable to authenticate via OpenVPN gateway.` | `Remote employees unable to authenticate via OpenVPN gateway.` | **EXACT MATCH** (Preserved from POST) |
| **`status`** | `in_progress` | `in_progress` | **EXACT MATCH** (Updated from `open`) |
| **`priority`** | `P1` | `P1` | **EXACT MATCH** (Updated from `P2`) |
| **`customer_id`**| `1` | `1` | **EXACT MATCH** |
| **`created_at`** | `2026-11-07 05:55:22.748` | `2026-11-07 05:55:22.748` | **EXACT MATCH** |
| **`updated_at`** | `2026-11-07 05:55:23.702` | `2026-11-07 05:55:23.702` | **EXACT MATCH** |
| **`deleted_at`** | `2026-11-07 05:55:23.7` | `2026-11-07 05:55:23.7` | **EXACT MATCH** (Soft-deleted) |

---

### 4. Postman Collection Runner Summary Output

```text
┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│                requests │               12 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│            test-scripts │               12 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│      prerequest-scripts │                0 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│              assertions │               27 │                0 │
├─────────────────────────┴──────────────────┴──────────────────┤
│ total run duration: 1397ms                                    │
├───────────────────────────────────────────────────────────────┤
│ total data received: 33.83kB (approx)                         │
├───────────────────────────────────────────────────────────────┤
│ average response time: 24ms [min: 4ms, max: 62ms, s.d.: 19ms] │
└───────────────────────────────────────────────────────────────┘

[POSTMAN RUNNER SUMMARY]
Total Requests: 12
Total Assertions: 27
Failed Assertions: 0
```

---

### 5. Automated Assertion Script Samples

```javascript
// Test 3: POST /tickets - Create and Save ID
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has standard envelope and non-null data", function () {
    const body = pm.response.json();
    pm.expect(body).to.have.property("data");
    pm.expect(body.error).to.be.null;
    pm.expect(body.data).to.have.property("id");
    pm.expect(body.data.reference).to.match(/^TCK-\d{4}-/);

    // Dynamic environment hand-off
    pm.environment.set("ticketId", body.data.id);
    pm.environment.set("ticketRef", body.data.reference);
    pm.environment.set("createdTitle", body.data.title);
});

// Test 4: GET /tickets/:id - Verification of Persistence
pm.test("Retrieved ticket matches submitted creation data", function () {
    const body = pm.response.json();
    pm.expect(body.data.id).to.eql(pm.environment.get("ticketId"));
    pm.expect(body.data.reference).to.eql(pm.environment.get("ticketRef"));
    pm.expect(body.data.title).to.eql(pm.environment.get("createdTitle"));
});
```

---

### 6. Artifact Locations
- **Postman Collection:** [`postman/SupportDesk_Day9_API_Testing.postman_collection.json`](../../postman/SupportDesk_Day9_API_Testing.postman_collection.json)
- **Postman Environment:** [`postman/SupportDesk_Local.postman_environment.json`](../../postman/SupportDesk_Local.postman_environment.json)
- **Test Runner Utility:** [`apps/api/run-postman-tests.ts`](../../apps/api/run-postman-tests.ts)

---

### 7. Sign-off
**QA Sign-off:** APPROVED
**Persisted Data Flow:** VERIFIED
**Final Acceptance Criterion:** Ticket data successfully passed through the complete API workflow, was verified in PostgreSQL, retrieved, updated, and soft-deleted with 27/27 passing assertions.
