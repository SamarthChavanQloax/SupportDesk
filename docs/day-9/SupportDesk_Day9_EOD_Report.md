# SupportDesk — Day 9 End of Day (EOD) Report
## API Skeleton and MVC in Practice (Week 2, Day 3)

---

### 1. Intern and Project Information
- **Intern Name:** SupportDesk Intern (Pair Programming with Antigravity AI)
- **Project Name:** SupportDesk — Customer Support Ticket Management System
- **Repository:** `D:\SupportD\SupportDesk`
- **Assigned Mentor / Lead:** Senior TypeScript Backend Engineer & Technical Mentor

### 2. Curriculum Information
- **Curriculum Day:** Week 2, Day 3 (Overall Day 9)
- **Date:** Saturday, 7 November 2026
- **Primary Objective:** Build and verify a production-ready SupportDesk REST API using Express, TypeScript, Zod, Prisma, and the four-layer architecture (`Routes -> Controllers -> Services -> Repositories -> Prisma -> PostgreSQL`).

---

### 3. API Startup and Configuration Evidence
- **Startup Command:** `npm run dev` / `ts-node src/index.ts`
- **Output:**
  ```text
  [SupportDesk API] Server successfully started
  [SupportDesk API] Listening on port: 3000
  [SupportDesk API] Environment: development
  [SupportDesk API] Health check available at: http://localhost:3000/health
  [SupportDesk API] Tickets endpoint available at: http://localhost:3000/tickets
  ```
- **Process Signals:** Handled `SIGTERM` and `SIGINT` for graceful connection termination.

---

### 4. TypeScript Strict Mode Confirmation
- **Configuration File:** [`apps/api/tsconfig.json`](../../apps/api/tsconfig.json)
- **Compiler Settings:**
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "commonjs",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "moduleResolution": "node",
      "outDir": "./dist",
      "rootDir": "."
    }
  }
  ```
- **Type Check Command:** `npx tsc --noEmit`
- **Actual Result:** Exited with code `0` (zero errors, zero warnings).

---

### 5. Zod Environment Validation
- **Source File:** [`apps/api/src/config/env.ts`](../../apps/api/src/config/env.ts)
- **Validated Variables:**
  - `PORT`: Validated as integer between `1` and `65535` (defaults to `3000`).
  - `NODE_ENV`: Validated against enum `['development', 'test', 'production']`.
  - `DATABASE_URL`: Required string pointing to the PostgreSQL database.
- **Security Guardrail:** On validation failure, descriptive issue details are output without ever printing credentials or connection string secrets.

---

### 6. Request Logger Implementation
- **Source File:** [`apps/api/src/middlewares/logger.middleware.ts`](../../apps/api/src/middlewares/logger.middleware.ts)
- **Captured Fields:** Timestamp, HTTP Method, Sanitized URL, Response Status Code, Duration in milliseconds.
- **Sanitization Rule:** Redacts query and URL parameters matching sensitive keywords (`token`, `key`, `password`, `secret`, `auth`). Never logs request bodies containing customer personal data.
- **Sample Output:**
  ```text
  [2026-11-07T05:55:22.434Z] GET /health 200 - 5ms
  [2026-11-07T05:55:22.608Z] GET /tickets 200 - 45ms
  [2026-11-07T05:55:22.760Z] POST /tickets 201 - 26ms
  [2026-11-07T05:55:23.051Z] PATCH /tickets/53 200 - 26ms
  [2026-11-07T05:55:23.342Z] GET /tickets/999999 404 - 6ms
  ```

---

### 7. Central Error Handler Implementation
- **Source File:** [`apps/api/src/middlewares/error.middleware.ts`](../../apps/api/src/middlewares/error.middleware.ts)
- **Supported Error Types:**
  - `ZodError` $\rightarrow$ Returns HTTP **400** with code `VALIDATION_ERROR` and structured field paths.
  - `AppError` / `NotFoundError` $\rightarrow$ Returns designated status (e.g., HTTP **404** with `NOT_FOUND`).
  - `SyntaxError` (Malformed JSON) $\rightarrow$ Returns HTTP **400** with code `INVALID_JSON`.
  - Unhandled / Unexpected Errors $\rightarrow$ Returns HTTP **500** with sanitized `INTERNAL_SERVER_ERROR`. Stack traces and raw SQL exceptions are logged internally but never exposed to clients.

---

### 8. GET `/health` Result
- **Request:** `GET http://localhost:3000/health`
- **HTTP Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "data": {
      "status": "ok",
      "uptime": 6,
      "timestamp": "2026-11-07T05:55:22.434Z",
      "service": "SupportDesk API"
    },
    "error": null,
    "meta": {}
  }
  ```

---

### 9. Ticket Endpoints Implemented

| HTTP Method | Endpoint | Description | Success Code |
| :--- | :--- | :--- | :--- |
| **GET** | `/tickets` | List tickets with optional status, priority, and user filtering | `200 OK` |
| **GET** | `/tickets/:id` | Fetch single ticket by ID with customer, assignee, and comments | `200 OK` |
| **POST** | `/tickets` | Create ticket with Zod validation and auto-generated reference | `201 Created` |
| **PATCH** | `/tickets/:id` | Update mutable fields (`status`, `priority`, `category`, `assigneeId`) | `200 OK` |
| **DELETE** | `/tickets/:id` | Soft-delete ticket (`deletedAt`), preserving audit retention | `200 OK` |

---

### 10. Four-Layer Request Flow Architecture

```text
Client / Postman
      │
      ▼
Routes (src/routes/)
  - Defines HTTP method and URL
  - Applies Zod validation middlewares
      │
      ▼
Controllers (src/controllers/)
  - Extracts and casts request inputs
  - Invokes service methods
  - Returns standard { data, error, meta } envelope
      │
      ▼
Services (src/services/)
  - Enforces domain rules (customer existence, reference generation)
  - Manages status transitions (e.g. setting resolvedAt / closedAt)
  - No coupling to Express req or res
      │
      ▼
Repositories (src/repositories/)
  - Encapsulates all PrismaClient queries
  - Isolated database access layer
      │
      ▼
Prisma ORM & PostgreSQL Database
```

---

### 11. Prisma Import Isolation Audit
- **Verification Rule:** Zero Prisma imports outside `src/repositories/`.
- **Command Executed:**
  ```powershell
  Select-String -Path "apps/api/src/**/*.ts" -Pattern "@prisma/client"
  ```
- **Audit Result:**
  ```text
  SupportDesk/apps/api/src/repositories/prisma.client.ts:1:import { PrismaClient } from '@prisma/client';
  SupportDesk/apps/api/src/repositories/ticket.repository.ts:2:import { TicketStatus, TicketPriority, Ticket } from '@prisma/client';
  ```
- **Conclusion:** 100% compliant. Zero Prisma imports exist in controllers, services, routes, or middlewares.

---

### 12. Standard Response Envelope Verification
Every endpoint complies with the uniform API contract:
```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

#### Actual 400 Validation Error Response:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request input validation failed",
    "details": [
      { "path": "title", "message": "Title must be at least 3 characters long" },
      { "path": "description", "message": "Description must be at least 5 characters long" },
      { "path": "customerId", "message": "customerId is required" }
    ]
  },
  "meta": {}
}
```

#### Actual 404 Not Found Response:
```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ticket with ID 999999 not found"
  },
  "meta": {}
}
```

#### Actual 500 Internal Error Response (Tested via `/test/error`):
```json
{
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  },
  "meta": {}
}
```

---

### 13. Mandatory Postman End-to-End API Testing & QA Report

#### A. Postman Artifacts
- **Collection:** [`postman/SupportDesk_Day9_API_Testing.postman_collection.json`](../../postman/SupportDesk_Day9_API_Testing.postman_collection.json)
- **Environment:** [`postman/SupportDesk_Local.postman_environment.json`](../../postman/SupportDesk_Local.postman_environment.json)
- **Detailed Standalone QA Report:** [`docs/day-9/SupportDesk_Day9_Postman_QA_Report.md`](SupportDesk_Day9_Postman_QA_Report.md)

#### B. Final Postman Test Verification Matrix

| Test Case | Method & Endpoint | Expected | Actual Status | Result | Evidence / Assertion Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Health Check** | `GET /health` | 200 OK | `200 OK` (5ms) | **PASS** | `status: "ok"`, `service: "SupportDesk API"`, uptime verified. |
| **2. List Tickets** | `GET /tickets` | 200 OK | `200 OK` (45ms) | **PASS** | Valid envelope, array returned with 50 seeded tickets, `meta.total = 50`. |
| **3. Create Ticket (Step 1)** | `POST /tickets` | 201 Created | `201 Created` (26ms) | **PASS** | Generated `id: 53`, `reference: TCK-2026-0051`, saved to environment. |
| **4. Retrieve Ticket (Step 2)**| `GET /tickets/{{ticketId}}` | 200 OK | `200 OK` (14ms) | **PASS** | Retrieved `id: 53` matches submitted data. |
| **5. Update Ticket (Step 3)** | `PATCH /tickets/{{ticketId}}`| 200 OK | `200 OK` (26ms) | **PASS** | Title updated to `VPN Gateway Resolved`, status `in_progress`, priority `P1`. |
| **6. Retrieve Updated (Step 4)**| `GET /tickets/{{ticketId}}` | 200 OK | `200 OK` (10ms) | **PASS** | Confirmed updated values persist across calls; unmodified fields remain intact. |
| **7. Invalid ID Validation** | `GET /tickets/invalid-id` | 400 Bad Request | `400 Bad Request` (2ms)| **PASS** | Zod rejects non-numeric ID with code `VALIDATION_ERROR`. |
| **8. Nonexistent ID (404)** | `GET /tickets/999999` | 404 Not Found | `404 Not Found` (6ms) | **PASS** | Returned code `NOT_FOUND` with message `"Ticket with ID 999999 not found"`. |
| **9. Invalid Body Schema** | `POST /tickets` (`{ "title": "AB" }`) | 400 Bad Request | `400 Bad Request` (2ms)| **PASS** | Rejects missing `description`, `customerId` with field-level issues array. |
| **10. Nonexistent Update** | `PATCH /tickets/999999` | 404 Not Found | `404 Not Found` (6ms) | **PASS** | Structured `NOT_FOUND` response for unmapped resource update. |
| **11. Controlled Error Test**| `GET /test/error` | 500 Internal Error | `500 Internal Error` (1ms)| **PASS** | Sanitized `INTERNAL_SERVER_ERROR` without leaking stack traces or SQL. |
| **12. Soft-Delete Ticket** | `DELETE /tickets/{{ticketId}}`| 200 OK | `200 OK` (16ms) | **PASS** | Response confirms `{ id: 53, deleted: true }`. Subsequent GET yields 404. |

#### C. Postman Collection Runner Summary
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

### 14. Step 5 — Direct PostgreSQL Database Persistence Verification

To prove that API responses reflect true relational database persistence rather than mocked data, a direct read-only query was executed against PostgreSQL inside the Docker container:

```sql
SELECT id, reference, title, description, status, priority, customer_id, created_at, updated_at, deleted_at
FROM tickets
WHERE id = 53;
```

#### Database Persistence Comparison Table:

| Column | API Submitted / Expected Value | Live PostgreSQL Database Record | Verification Result |
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

### 15. Blockers Encountered and Resolved
1. **Express 5 Getter Immutability:** Express 5's `req.query` is a read-only getter property. Directly reassigning it in validation middlewares triggered `TypeError: Cannot set property query of #<IncomingMessage> which has only a getter`. Resolved by parsing and validating query objects without mutating the getter property.
2. **TypeScript Strict Param Typing:** In `@types/express` v5, route parameters are typed as `string | string[]`. Passing them directly to `parseInt` produced compilation error `TS2345`. Resolved with a type-safe `parseId` utility function.
3. **Database Cleanliness Retention:** Postman test suite created temporary test tickets (IDs 51, 52, 53) which were cleanly purged after test completion, preserving the exact original 50 sample tickets in the database.

---

### 16. What Was Learned Today
1. Decoupling database operations into isolated repository classes simplifies refactoring and keeps HTTP controller logic clean.
2. Writing Zod schemas defensively against API inputs prevents invalid database queries from ever reaching PostgreSQL.
3. Central error handling ensures uniform error payloads across all endpoints while keeping internal stack traces and credentials completely shielded from API clients.
4. Automated Postman Collection Runner execution (via Newman) paired with direct PostgreSQL query verification provides incontrovertible proof of end-to-end data flow.

---

### 17. Git Branch and Submission Information
- **Working Branch:** `feature/day-9-api-mvc`
- **Base Branch:** `feature/day-8-database-design` (or `main`)
- **Target Commit Message:** `feat(api): add SupportDesk ticket CRUD endpoints, four-layer architecture, and Postman QA suite`
- **Submission Status:** Ready for Git staging, commit, and Pull Request creation.

---

### 18. Sign-off
**Completed by:** SupportDesk Intern
**Reviewed by:** Senior TypeScript Backend Engineer & Technical Mentor
