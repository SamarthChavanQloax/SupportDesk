# SupportDesk Day 12 End of Day (EOD) & Week 2 Summary Report
**Date:** Wednesday, 11 November 2026 (Schedule: Week 2 — Day 6 / Overall Day 12)
**Track:** Full-Stack TypeScript Engineering
**PR Reviewed:** [#26 — `feature/day-11-query-docs-tests` -> `main`](https://github.com/SamarthChavanQloax/SupportDesk/pull/26)
**Status:** Code Review, Security/Bug Fixes, Automated Verification & Postman API Demo Complete; Personal Quiz & Retro Prompts Pending Intern Responses

---

## 1. Executive Summary

Because no external peer partner PR was assigned for today's review session, PR `#26` (`feature/day-11-query-docs-tests`) was audited using the Day 12 code-review checklist. The review uncovered **10 actionable findings**, including a **critical internal-comment data leak** on `GET /tickets/:id`, an empty-result `totalPages` off-by-one bug, discarded Zod query coercion/trimming, `0` filter bypasses in query validation/repository `WHERE` clauses, and several OpenAPI vs. runtime schema drifts.

All valid defects were fixed, covered with unit + Supertest regression tests, re-verified across TypeScript, Jest (`86 / 86` tests passing, `92.7%` service statement coverage), Day 10 security regression (`19 / 19` passed), and a 14-request end-to-end Postman/Newman API demo (`17 / 17` assertions passed).

---

## 2. Code Review Findings & Resolutions (PR `#26`)

| # | Severity | Scope & Source | Finding | Resolution Status |
| --- | --- | --- | --- | --- |
| 1 | **Critical (Security)** | `ticket.repository.ts`, `ticket.service.ts`, `comment-visibility.util.ts` | `GET /tickets/:id` included all non-deleted `comments` without stripping `isInternal: true` notes for customers (`filterCommentsForRole` was unused in `src/`). | **Fixed:** `TicketService.getTicketById` now applies `filterCommentsForRole` when `comments` are present; unit & Supertest regression tests added. |
| 2 | **Medium (Bug)** | `ticket.repository.ts` | `Math.ceil(total / limit) \|\| 1` returned `totalPages: 1` when `total === 0`. | **Fixed:** Changed to `total === 0 ? 0 : Math.ceil(total / limit)` + Supertest test added. |
| 3 | **Medium (Design)** | `validate.middleware.ts`, `ticket.controller.ts` | `validateQuery` discarded parsed Zod output (`schema.parse(req.query)`), forcing manual query parsing in `getTickets` and forwarding untrimmed `search`. Redundant `if/else` in `validateBody`. | **Fixed:** `validateQuery` stores parsed query on `res.locals.validatedQuery`; `getTickets` consumes it directly; simplified `validateBody`. |
| 4 | **Medium (Bug)** | `ticket.validation.ts`, `ticket.repository.ts` | `customerId=0` / `assigneeId=0` matched `/^\d+$/` and were silently ignored by truthy checks in `buildWhereClause`. | **Fixed:** Enforced `.pipe(z.number().int().min(1))` in `ticketQuerySchema` and `!== undefined` in `buildWhereClause` + Supertest test added. |
| 5 | **Medium (Docs)** | `openapi.json` | Spec drifted from code: `CreateTicketRequest`/`UpdateTicketRequest` bounds & fields, missing `400` on `GET /tickets`, missing `403` on `PATCH /tickets/{id}`, `AuthResponse` using `token` instead of `accessToken`, `RegisterResponse` mismatch, `Comment.author` missing `email`, `Ticket` missing `category`/`comments`. | **Fixed:** Synchronized `openapi.json` schemas, response envelopes, and status codes with Zod validators and repositories. |
| 6 | **Low/Med (Bug)** | `ticket.service.ts` | Reopening a resolved/closed ticket to `waiting_on_customer` left stale `resolvedAt`/`closedAt` timestamps set. | **Fixed:** Added `'waiting_on_customer'` to timestamp reset check + unit test added. |
| 7 | **Medium (Concurrency)** | `ticket.service.ts`, `ticket.repository.ts` | `ticketRepository.count()` ignored soft-deleted tickets (`deletedAt: null`), risking `reference` collisions after soft deletes. | **Fixed:** `count(includeDeleted = false)` added and `createTicket` calls `count(true)`. *(Concurrent unique DB sequence retry remains a future scalability note.)* |
| 8 | **Low/Med (Security)** | `ticket.service.ts` | `getAllTickets` failed open (unscoped) if called without `currentUser`. | **Fixed:** Both `getAllTickets` and `getTicketById` fail closed with `UnauthorizedError` if `!currentUser` + unit test added. |
| 9 | **Low (Duplication)** | `ticket.controller.ts`, `comment.controller.ts` | Duplicated `parseId` helper in both controllers. | **Fixed:** Extracted shared `parseIdParam` in `src/utils/params.util.ts`. |
| 10 | **Design Question** | `ticket.routes.ts`, `ticket.service.ts` | Customers can `PATCH /tickets/:id` status (including `'resolved'`/`'closed'`). | **Documented / Preserved:** Left unchanged to avoid breaking Day 10/11 behaviour pending lead confirmation. |

### Human vs. AI Review Comparison
- **Peer Context:** No review partner was assigned in this session; review performed against own PR `#26`.
- **Human Review Notes:** _[Pending your notes — add any observations you noted when inspecting PR `#26` `Files changed`]_

---

## 3. Quality Gate Verification (After Final Edits)

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript Check | `npx tsc --noEmit` (`apps/api`) | **PASS** (0 errors) |
| Full Jest Suite + Coverage | `npm run test:coverage` (`apps/api`) | **PASS** — **6 / 6 suites**, **86 / 86 tests** (`79` baseline + `7` new review regression tests) |
| Service Coverage (`src/services/`) | `jest --coverage` | **92.7%** Stmts, **87.5%** Branches, **100%** Funcs, **95.45%** Lines |
| Day 10 Security Regression (Dev DB) | `npm run test:day10` (`apps/api`) | **PASS** — **19 / 19** checks passed |
| Postman / Newman End-to-End Demo | `npx ts-node run-day12-demo.ts` (`apps/api`, isolated test DB on port `3007`) | **PASS** — **14 / 14 requests**, **17 / 17 assertions**, **0 failed** (avg `19ms`) |

---

## 4. Postman API Demo Assets (`Phase 5`)
- **Collection:** `postman/SupportDesk_Day12_API_Demo.postman_collection.json`
- **Automated Runner:** `apps/api/run-day12-demo.ts` (runs cleanly against isolated `supportdesk_test` DB via `.env.test`)
- **Flow Demonstrated:**
  1. `GET /health` -> `200 OK` standard `{ data, error: null, meta }` envelope
  2. `GET /docs/` -> `200 OK` interactive Swagger UI HTML
  3. `POST /auth/login` (customer + agent JWT issuance)
  4. `POST /tickets` as customer (ignores spoofed `customerId: 9999`)
  5. `GET /tickets` customer scoping + pagination metadata + agent search & filter (`search`, `priority`)
  6. `POST /tickets/:id/comments`: customer public comment (`201`), customer `isInternal: true` (`403`), agent `isInternal: true` (`201`)
  7. `GET /tickets/:id`: customer sees public comments only; agent sees internal + public notes
  8. `GET /tickets?sortBy=password_hash` -> `400 VALIDATION_ERROR`; `DELETE /tickets/:id` as customer -> `403 FORBIDDEN`

---

## 5. Week 2 Backend Architecture Walkthrough (Route -> DB -> Response)
1. **Middleware & Route Layer (`app.ts`, `routes/`):** Helmet headers & CORS allowlist (`app.ts`) -> JSON parsing & request logger -> Swagger UI (`/docs`, `/docs.json`) -> JWT verification (`requireAuth`), RBAC (`requireRole`), and Zod validation (`validateParams`, `validateQuery` via `res.locals.validatedQuery`, `validateBody`).
2. **Controller Layer (`controllers/`):** Extracts `parseIdParam`, `res.locals.validatedQuery`, and `req.user`, delegates to services, and wraps output in `{ data, error: null, meta }`.
3. **Service Layer (`services/`):** Enforces customer ownership scoping (`customerId = currentUser.id`), internal comment confidentiality (`filterCommentsForRole` & `includeInternal`), state transition timestamps, and throws typed domain errors (`NotFoundError`, `ForbiddenError`, `BadRequestError`, `UnauthorizedError`).
4. **Repository Layer (`repositories/`):** Sole Prisma boundary (`prisma.client.ts`), enforces `deletedAt: null` soft-delete filtering, allowlisted sorting, parameterized case-insensitive search, and returns both page rows and exact scoped `total`.
5. **Central Error Handler (`middlewares/error.middleware.ts`):** Maps Zod validation errors, typed `AppError` subclasses, and unexpected errors into standard `{ data: null, error: { code, message, details? }, meta: {} }` envelopes without leaking stack traces or secrets.

---

## 6. Week 2 Quiz & Retrospective (`Pending Intern Input`)
- **Week 2 Quiz:** _[Pending your answers to Questions 1–6]_
- **Keep:** _[Pending your reflection]_
- **Start:** _[Pending your reflection]_
- **Stop:** _[Pending your reflection]_
