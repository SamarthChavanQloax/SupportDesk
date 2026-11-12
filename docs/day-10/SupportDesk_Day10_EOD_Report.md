# Day 10 — Authentication, Roles and Security — EOD Report

**Project:** SupportDesk — Customer Support Ticket Management System  
**Curriculum:** Week 2, Day 4 (Overall Day 10)  
**Date:** Saturday, 7 November 2026 (Executed Monday, 9 November 2026)  
**Repository:** `D:\SupportD\SupportDesk`  
**Intern / Engineer:** SupportDesk Intern (Pair Programming with Antigravity AI)  
**Mentor / Reviewer:** Senior TypeScript Backend Engineer & Technical Mentor  

---

### Executive Deliverable Matrix

| Requirement | Implementation & File Location | Verification Status |
| :--- | :--- | :--- |
| **Registration Endpoint** | `POST /auth/register` in `src/routes/auth.routes.ts` | **PASS (201 Created)** |
| **Password Hashing** | bcrypt with work factor 10 in `src/services/auth.service.ts` | **PASS (Hash stored, plain absent)** |
| **Login Endpoint & JWT** | `POST /auth/login` issuing signed JWT with ID & role | **PASS (200 OK + Bearer Token)** |
| **Authentication Middleware** | `requireAuth` in `src/middlewares/auth.middleware.ts` | **PASS (Rejects 401 on missing/bad token)** |
| **Role-Based Access Control** | `requireRole` in `src/middlewares/auth.middleware.ts` | **PASS (Rejects 403 on role mismatch)** |
| **Customer Ticket Isolation** | Scoped queries (`where.customerId = user.id`) in `ticket.repository.ts` | **PASS (Only owns visible; 404 on others)** |
| **Agent Ticket Visibility** | Agents query all 50 tickets without customer restriction | **PASS (Full inventory visible)** |
| **Baseline API Security** | Helmet headers & explicit CORS allowlist in `src/app.ts` | **PASS (Headers present, CORS enforced)** |
| **Brute-Force Protection** | Login rate limiter (10 attempts / 15m) in `src/middlewares/rate-limit.middleware.ts` | **PASS (Returns 429 Too Many Requests)** |
| **OWASP Top 10 Review** | 3 confirmed vulnerabilities identified, remediated, & regression-tested | **PASS (BOLA, Privilege Escalation, Brute Force)** |
| **Automated Testing** | Standalone test suite (`test-day10.ts`) + Newman Postman runner | **PASS (19/19 Tests, 32/32 Postman Assertions)** |

---

## 1. API branch and PR link:
- **Active Working Branch:** `feature/day-10-auth-security`
- **Base Branch:** `feature/day-9-api-mvc` (or `main`)
- **Remote Repository:** `https://github.com/SamarthChavanQloax/SupportDesk.git`
- **Pull Request Creation Link:**  
  👉 **[Open Day 10 Pull Request on GitHub](https://github.com/SamarthChavanQloax/SupportDesk/compare/feature/day-9-api-mvc...feature/day-10-auth-security?expand=1)**

---

## 2. Existing User model/role assumptions confirmed:
- **Prisma Model:** Verified in [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma):
  - `id`: `Int @id @default(autoincrement())`
  - `email`: `String @unique`
  - `name`: `String`
  - `passwordHash`: `String? @map("password_hash")`
  - `role`: `Role @default(customer)` (Enum values: `customer`, `agent`, `admin`)
  - `isActive`: `Boolean @default(true) @map("is_active")`
- **Confirmation:** No database schema migration was required because `passwordHash` and `role` were already defined in the Day 8 schema. All 6 seeded users were populated with bcrypt hashes for `Password123!`.

---

## 3. Registration endpoint and test result:
- **Endpoint:** `POST /auth/register`
- **Validation Schema:** [`apps/api/src/validations/auth.validation.ts`](../../apps/api/src/validations/auth.validation.ts) (requires `name` min 2 chars, valid `email`, and strong `password` with min 8 chars including uppercase, lowercase, and number).
- **Public Role Safety:** The schema omits `role`. Registration strictly assigns `Role.customer`, preventing unauthorized privilege escalation.
- **Duplicate Prevention:** Returns `409 Conflict` with code `CONFLICT` if email already exists.
- **Test Evidence (Test AUTH-01):**
  - Request: `POST /auth/register` with `name`, `email`, `password`.
  - HTTP Status: `201 Created`
  - Response Body:
    ```json
    {
      "data": {
        "id": 8,
        "name": "Asha Customer",
        "email": "asha.customer.day10@example.test",
        "role": "customer"
      },
      "error": null,
      "meta": {}
    }
    ```

---

## 4. Password hashing implementation:
- **Library:** `bcryptjs`
- **Work Factor:** Salt rounds = `10`
- **Source File:** [`apps/api/src/services/auth.service.ts`](../../apps/api/src/services/auth.service.ts)
- **Database Verification (Test AUTH-04):**
  - Inspected PostgreSQL database row for created user.
  - Plain-text password `"Password123!"` is completely absent.
  - Field `password_hash` contains one-way bcrypt digest beginning with `$2b$10$...`.
  - Verified `bcrypt.compare("Password123!", dbRecord.passwordHash)` evaluates to `true`.

---

## 5. Login endpoint and test result:
- **Endpoint:** `POST /auth/login`
- **Test Evidence (Test AUTH-05):**
  - Request: `POST /auth/login` with email `"alice.customer@example.com"` and `"Password123!"`.
  - HTTP Status: `200 OK`
  - Response Body:
    ```json
    {
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhbGljZS5jdXN0b21lckBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc2MjY3ODgwMCwiZXhwIjoxNzYyNzA3NjAwfQ...",
        "user": {
          "id": 1,
          "name": "Alice Johnson",
          "email": "alice.customer@example.com",
          "role": "customer"
        }
      },
      "error": null,
      "meta": {}
    }
    ```
- **Enumeration Defense (Test AUTH-06 & AUTH-07):** Both wrong password and nonexistent email return identical `401 Unauthorized` responses with `"Invalid email or password"`.

---

## 6. JWT claims and expiry configuration:
- **Claims Stored in Token:**
  - `id`: Numerical user ID (e.g. `1`)
  - `email`: Normalized user email
  - `role`: Domain role (`customer`, `agent`, or `admin`)
- **Expiry:** Configured via `env.JWT_EXPIRES_IN` (`8h` for development/production session lifecycle).
- **Secret Management:** Loaded from `env.JWT_SECRET` (validated with Zod to enforce a minimum entropy of 32 characters). Zero hardcoded secrets in source control.

---

## 7. `requireAuth` implementation:
- **Source File:** [`apps/api/src/middlewares/auth.middleware.ts`](../../apps/api/src/middlewares/auth.middleware.ts)
- **Logic:**
  1. Reads `req.headers.authorization`.
  2. Verifies `Bearer <token>` format. If missing, throws `UnauthorizedError(401)`.
  3. Verifies token signature using `authService.verifyToken(token)`.
  4. Decodes claims and attaches verified user to `req.user`.
  5. If malformed or expired, throws `UnauthorizedError(401)`.

---

## 8. `requireRole` implementation:
- **Source File:** [`apps/api/src/middlewares/auth.middleware.ts`](../../apps/api/src/middlewares/auth.middleware.ts)
- **Logic:**
  1. Executes after `requireAuth`.
  2. Checks `allowedRoles.includes(req.user.role)`.
  3. If role is not allowed, throws `ForbiddenError` returning HTTP `403 Forbidden` with code `FORBIDDEN`.

---

## 9. Customer ticket ownership test:
- **Test Evidence (Test AUTH-13 & AUTH-14):**
  - Authenticated as customer Alice (ID 1).
  - Calling `GET /tickets/1` (her ticket) returns `200 OK` with full details.
  - Calling `GET /tickets/2` (Bob's ticket) returns `404 Not Found` with message `"Ticket with ID 2 not found"`.
  - **Security Outcome:** The endpoint acts as if the ticket does not exist, completely preventing ticket ID enumeration and cross-customer data leakage.
  - Query executed at repository level: `SELECT ... FROM tickets WHERE id = 2 AND customer_id = 1 AND deleted_at IS NULL;`

---

## 10. Agent ticket access test:
- **Test Evidence (Test AUTH-15):**
  - Authenticated as agent Dave (ID 4).
  - Calling `GET /tickets` returns `200 OK` with `meta.total = 50`.
  - Dave has access to the complete inventory across all customers for support resolution.

---

## 11. Helmet configuration:
- **Source File:** [`apps/api/src/app.ts`](../../apps/api/src/app.ts)
- **Middleware Registered:** `app.use(helmet())`
- **Observed Response Headers (Test AUTH-19):**
  - `x-content-type-options: nosniff`
  - `x-frame-options: SAMEORIGIN`
  - `x-dns-prefetch-control: off`
  - `strict-transport-security: max-age=31536000; includeSubDomains`
  - `x-download-options: noopen`

---

## 12. CORS allowlist:
- **Source File:** [`apps/api/src/app.ts`](../../apps/api/src/app.ts)
- **Configuration:** `env.CORS_ORIGIN` (`http://localhost:5173,http://localhost:3000`)
- **Test Evidence (Test AUTH-17):**
  - Approved request with `Origin: http://localhost:5173` returns header `Access-Control-Allow-Origin: http://localhost:5173`.
  - Unapproved request with `Origin: http://malicious-site.com` omits the header, causing the browser to block cross-origin access.

---

## 13. Login rate-limit configuration and test:
- **Source File:** [`apps/api/src/middlewares/rate-limit.middleware.ts`](../../apps/api/src/middlewares/rate-limit.middleware.ts)
- **Configuration:** Window = 15 minutes, Max = 10 attempts per IP.
- **Test Evidence (Test AUTH-18):**
  - Subsequent requests beyond 10 attempts immediately return HTTP `429 Too Many Requests`.
  - Response Body:
    ```json
    {
      "data": null,
      "error": {
        "code": "TOO_MANY_REQUESTS",
        "message": "Too many login attempts from this IP. Please try again after 15 minutes."
      },
      "meta": {}
    }
    ```

---

## 14. Postman 401 evidence:
- **Scenario:** Call `GET /tickets` without `Authorization` header.
- **HTTP Status:** `401 Unauthorized`
- **Response:**
  ```json
  {
    "data": null,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication required. Please provide a valid Bearer token."
    },
    "meta": {}
  }
  ```

---

## 15. Postman 403 evidence:
- **Scenario:** Authenticated customer Alice calls agent-only route `DELETE /tickets/1`.
- **HTTP Status:** `403 Forbidden`
- **Response:**
  ```json
  {
    "data": null,
    "error": {
      "code": "FORBIDDEN",
      "message": "Forbidden: Role 'customer' is not authorized to access this resource."
    },
    "meta": {}
  }
  ```

---

## 16. Password hash/secret exposure checks:
- **Automated Check (Test AUTH-16):** Scanned all JSON response payloads across registration, login, ticket list, and single ticket retrieval.
- **Finding:** Zero instances of `passwordHash` or `password_hash` exist in API responses.
- **Log Check:** Request logger filters and masks authorization tokens and passwords (`[REDACTED]`).

---

## 17. OWASP findings identified:
1. **OWASP A01:2021 — Broken Object Level Authorization (BOLA / IDOR):**  
   *Risk:* Customers could access or modify any ticket by guessing numerical ticket IDs in URL parameters.
2. **OWASP A01:2021 — Privilege Escalation via Mass Assignment:**  
   *Risk:* A user registering publicly could submit `role: "admin"` and grant themselves administrative rights.
3. **OWASP A07:2021 — Identification and Authentication Failures (Brute Force):**  
   *Risk:* The login endpoint had no rate limiting, allowing unlimited dictionary and credential-stuffing attacks.

---

## 18. Confirmed findings fixed and regression tests:
1. **Fix for BOLA/IDOR:** Updated `TicketRepository.findById` and `TicketService` to enforce `customerId = currentUser.id` in database queries for customers. Returns 404 if ticket belongs to another customer. Verified by `AUTH-14`.
2. **Fix for Privilege Escalation:** Excluded `role` from `registerSchema` and hardcoded `Role.customer` in `AuthService.register`. Verified by `AUTH-01`.
3. **Fix for Brute Force:** Registered `loginRateLimiter` on `POST /auth/login` returning 429 when threshold exceeded. Verified by `AUTH-18`.

---

## 19. Automated test command and actual result:

### A. Execution Commands
```bash
# Run standalone 19-scenario authentication & security test suite
npm run test:day10

# Run automated Postman collection runner via Newman (16 requests, 32 assertions)
npx ts-node run-day10-tests.ts
```

### B. Complete Day 10 Authentication Test Verification Matrix

| Test ID | Scenario Tested | HTTP Method & Route | Expected Result | Actual Result Observed | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Register valid customer | `POST /auth/register` | 201 Created; safe user | **201 Created** (User ID: 8, `role: "customer"`, `passwordHash` omitted) | ✅ **PASS** |
| **AUTH-02** | Duplicate registration | `POST /auth/register` | 409 Conflict | **409 Conflict** (`code: "CONFLICT"`, email already exists) | ✅ **PASS** |
| **AUTH-03** | Invalid registration input | `POST /auth/register` | 400 Bad Request | **400 Bad Request** (`code: "VALIDATION_ERROR"`, 4 field issues) | ✅ **PASS** |
| **AUTH-04** | Password storage check | PostgreSQL DB Query | Bcrypt hash stored, plain absent | **`$2b$10$...`** hash stored; plain `"Password123!"` absent | ✅ **PASS** |
| **AUTH-05** | Login valid credentials | `POST /auth/login` | 200 OK + JWT | **200 OK** (Returned valid JWT `accessToken` & safe user details) | ✅ **PASS** |
| **AUTH-06** | Login wrong password | `POST /auth/login` | 401 Unauthorized | **401 Unauthorized** (`"Invalid email or password"`) | ✅ **PASS** |
| **AUTH-07** | Login unknown email | `POST /auth/login` | 401 Unauthorized | **401 Unauthorized** (Identical message; prevents user enumeration) | ✅ **PASS** |
| **AUTH-08** | Missing token | `GET /tickets` | 401 Unauthorized | **401 Unauthorized** (`code: "UNAUTHORIZED"`, Bearer token required) | ✅ **PASS** |
| **AUTH-09** | Malformed token | `GET /tickets` (`Bearer invalid-xyz`) | 401 Unauthorized | **401 Unauthorized** (`code: "UNAUTHORIZED"`) | ✅ **PASS** |
| **AUTH-10** | Expired/bad signature token | `GET /tickets` (`Bearer fakeSig`) | 401 Unauthorized | **401 Unauthorized** (`code: "UNAUTHORIZED"`) | ✅ **PASS** |
| **AUTH-11** | Customer permitted route | `GET /tickets` (Alice's token) | 200 OK | **200 OK** (Returned only Alice's 17 scoped tickets) | ✅ **PASS** |
| **AUTH-12** | Wrong role access | `DELETE /tickets/1` (Alice's token) | 403 Forbidden | **403 Forbidden** (`code: "FORBIDDEN"`, agent role required) | ✅ **PASS** |
| **AUTH-13** | Customer own ticket | `GET /tickets/1` (Alice's token) | 200 OK | **200 OK** (Ticket #1 retrieved; title matches) | ✅ **PASS** |
| **AUTH-14** | Customer other's ticket | `GET /tickets/2` (Alice's token) | 404 Not Found | **404 Not Found** (Conceals Bob's ticket #2; zero data leakage) | ✅ **PASS** |
| **AUTH-15** | Agent ticket visibility | `GET /tickets` (Dave's token) | 200 OK (all tickets) | **200 OK** (All 50 tickets across all customers visible to agent) | ✅ **PASS** |
| **AUTH-16** | Password hash exposure check | All response payloads | `passwordHash` absent | **Zero instances** of password hashes in any API response | ✅ **PASS** |
| **AUTH-17** | CORS origin allowlist | `GET /health` with `Origin` | Only approved origins pass | `http://localhost:5173` **accepted**; `malicious-site.com` **rejected** | ✅ **PASS** |
| **AUTH-18** | Login rate limiting | `POST /auth/login` (> 10 tries) | 429 Too Many Requests | **429 Too Many Requests** (`code: "TOO_MANY_REQUESTS"`) | ✅ **PASS** |
| **AUTH-19** | Helmet security headers | `GET /health` headers | Helmet headers present | `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN` | ✅ **PASS** |

### C. Console Output from `npm run test:day10`
```text
====================================================
Starting Day 10 Authentication & Security Test Suite
====================================================

[PASS] AUTH-19 - Helmet Security Headers present on responses Status: 200
[PASS] AUTH-17 - CORS origin allowlist correctly permits approved and rejects unapproved
[PASS] AUTH-01 - Register valid customer succeeds with safe user and 201 Created Status: 201, User ID: 8, Role: customer
[PASS] AUTH-02 - Duplicate registration returns 409 Conflict Status: 409, Code: CONFLICT
[PASS] AUTH-03 - Invalid registration input returns 400 Validation Error Status: 400, Details count: 4
[PASS] AUTH-04 - Password stored as bcrypt hash; plain password absent in DB Hash prefix: $2b$10$
[PASS] AUTH-05 - Login valid credentials returns 200 OK and JWT access token Status: 200, Token length: 208
[PASS] AUTH-06 - Login with wrong password returns 401 Unauthorized with generic message Status: 401, Error: Invalid email or password
[PASS] AUTH-07 - Login with unknown email returns identical 401 generic error (prevents enumeration) Status: 401, Error: Invalid email or password
[PASS] AUTH-08 - Protected endpoint without Authorization header returns 401 Unauthorized Status: 401
[PASS] AUTH-09 - Protected endpoint with malformed token returns 401 Unauthorized Status: 401
[PASS] AUTH-10 - Protected endpoint with invalid signature token returns 401 Unauthorized Status: 401
[PASS] AUTH-11 - Customer token on customer-permitted route returns 200 OK Status: 200, Tickets returned: 17
[PASS] AUTH-12 - Customer token on agent-only route (DELETE /tickets/:id) returns 403 Forbidden Status: 403, Error Code: FORBIDDEN
[PASS] AUTH-13 - Customer can retrieve their own ticket Status: 200, Ticket ID: 1, Title: Cannot sign in to customer portal
[PASS] AUTH-14 - Customer querying another customer ticket returns 404 Not Found (no data leakage) Status: 404, Ticket Target: #2
[PASS] AUTH-15 - Agent can view all tickets across all customers Total tickets visible to agent: 50
[PASS] AUTH-16 - passwordHash is never exposed in any API response Exposed: false
[PASS] AUTH-18 - Login rate limiter returns 429 Too Many Requests when threshold exceeded Status: 429

====================================================
DAY 10 TEST RESULTS: 19 / 19 PASSED (100%)
====================================================
```

### D. Postman Newman Collection Runner Output
```text
┌─────────────────────────┬───────────────────┬──────────────────┐
│                         │          executed │           failed │
├─────────────────────────┼───────────────────┼──────────────────┤
│              iterations │                 1 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│                requests │                16 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│            test-scripts │                16 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│      prerequest-scripts │                 0 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│              assertions │                32 │                0 │
├─────────────────────────┴───────────────────┴──────────────────┤
│ total run duration: 1760ms                                     │
├────────────────────────────────────────────────────────────────┤
│ average response time: 28ms [min: 2ms, max: 104ms, s.d.: 34ms] │
└────────────────────────────────────────────────────────────────┘

===============================================================
[DAY 10 POSTMAN RUNNER SUMMARY]
Total Requests: 16
Total Assertions: 32
Failed Assertions: 0
Pass Rate: 100.0%
===============================================================
```

---

## 20. Prompt Journal updated:
- Updated [`docs/prompt-journal.md`](../prompt-journal.md) with **Entry 15** (Authentication & Password Hashing Architecture) and **Entry 16** (RBAC, Data-Scoping & OWASP Remediation) using the required 6-Box prompt discipline.

---

## 21. Blockers or lead decisions needed:
- **None.** All Day 10 goals are fully achieved with zero blockers.

---

## 22. What I learned today:
1. **Defense in Depth for Authorization:** Role-based checks (`requireRole`) verify permissions, but object-level scoping (`where.customerId = user.id`) is mandatory to prevent horizontal privilege escalation (IDOR).
2. **Generic Authentication Responses:** Unifying "wrong password" and "unknown email" responses under one identical error message stops attackers from enumerating valid account emails.
3. **Mass Assignment Prevention:** Input validation schemas must be strictly whitelist-based so sensitive fields like `role` or `isActive` can never be supplied by public clients during registration.

---

### Sign-off
**Completed by:** SupportDesk Intern  
**Reviewed by:** Senior TypeScript Backend Engineer & Technical Mentor  
**Status:** 100% COMPLETE & VERIFIED (19/19 Tests + 32/32 Postman Assertions Passing)

