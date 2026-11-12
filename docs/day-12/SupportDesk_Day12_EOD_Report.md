# SupportDesk Day 12 End of Day (EOD) & Week 2 Summary Report
**Date:** Wednesday, 11 November 2026 (Curriculum: Week 2 — Day 6 / Overall Day 12)  
**Track:** Full-Stack TypeScript Engineering  
**PR Reviewed:** [#26 — `feature/day-11-query-docs-tests` -> `main`](https://github.com/SamarthChavanQloax/SupportDesk/pull/26)  
**Branches Synced Locally:** `feature/day-11-query-docs-tests`, `samarth` (ready to push)  
**Status:** Complete — Human & AI Code Review, Security/Bug Fixes, Verification Gates, Postman API Demo, Quiz Reference & Week 2 Summary

---

## 1. Executive Summary

No external peer partner PR was assigned for today's review session, so PR `#26` (`feature/day-11-query-docs-tests`) was used for the full Day 12 code review and hardening workflow. Following the human review pass across PR `#26`'s changed files, an AI second-review audit surfaced **10 concrete engineering findings**, led by a **critical internal-comment data leak** on `GET /tickets/:id`, an empty-result `totalPages` off-by-one bug, discarded Zod query coercion/trimming, `0` filter bypasses in query validation/repository `WHERE` clauses, and several OpenAPI vs. runtime schema drifts.

All **9 valid code/documentation defects** were resolved (`deda957`), backed by **7 new regression tests**, and re-verified after final edits:
- **TypeScript (`npx tsc --noEmit`):** 0 errors
- **Full Jest Suite + Coverage (`npm run test:coverage`):** **6 / 6 suites**, **86 / 86 tests passed** (`92.7%` service statements, `100%` functions)
- **Day 10 Regression (`npm run test:day10`):** **19 / 19 checks passed**
- **Postman / Newman End-to-End Demo (`run-day12-demo.ts`):** **14 / 14 requests**, **17 / 17 assertions**, **0 failed** (avg `19ms`)

---

## 2. Human & AI Code Review Findings and Resolutions (PR `#26`)

### 2.1 Review Process & Human vs. AI Comparison
- **Human Code Review (Completed):** Audited PR `#26` (`Files changed`) against the Day 12 checklist across routes, validation schemas, controllers, services, repositories, OpenAPI specs, and test suites (Correctness, 4-Layer Architecture, Readability, RBAC/Ownership Security, Data Handling & Error Envelopes, Automated Tests).
- **AI Second Review Comparison:** AI second-pass inspection traced runtime call paths across all layers and identified exact line-level contract drifts (`GET /tickets/:id` comment inclusion vs. `filterCommentsForRole`, discarded `validateQuery` transforms in Express 5, `totalPages || 1` when `total === 0`, OpenAPI `AuthResponse`/`CreateTicketRequest` mismatches, and fail-open optional `currentUser` in `TicketService.getAllTickets`). One item (#10 — customer `PATCH /tickets/:id` status transitions) was flagged as a **product/design question** rather than modified unilaterally so Day 10/11 behavior remained intact.

### 2.2 Actionable Findings Matrix

| # | Severity | Scope & Source | Finding | Resolution Status |
| --- | --- | --- | --- | --- |
| 1 | **Critical (Security)** | `ticket.repository.ts`, `ticket.service.ts`, `comment-visibility.util.ts` | `GET /tickets/:id` included all non-deleted `comments` without stripping `isInternal: true` notes for customers (`filterCommentsForRole` was unused in `src/`). | **Fixed (`deda957`):** `TicketService.getTicketById` applies `filterCommentsForRole` when `comments` are present; unit & Supertest regression tests added. |
| 2 | **Medium (Bug)** | `ticket.repository.ts` | `Math.ceil(total / limit) \|\| 1` returned `totalPages: 1` when `total === 0`. | **Fixed (`deda957`):** Changed to `total === 0 ? 0 : Math.ceil(total / limit)` + Supertest empty-search test added. |
| 3 | **Medium (Design)** | `validate.middleware.ts`, `ticket.controller.ts` | `validateQuery` discarded parsed Zod output (`schema.parse(req.query)`), forcing manual query parsing in `getTickets` and forwarding untrimmed `search`. Redundant `if/else` in `validateBody`. | **Fixed (`deda957`):** `validateQuery` stores parsed query on `res.locals.validatedQuery`; `getTickets` consumes it directly; simplified `validateBody`. |
| 4 | **Medium (Bug)** | `ticket.validation.ts`, `ticket.repository.ts` | `customerId=0` / `assigneeId=0` matched `/^\d+$/` and were silently ignored by truthy checks in `buildWhereClause`. | **Fixed (`deda957`):** Enforced `.pipe(z.number().int().min(1))` in `ticketQuerySchema` and `!== undefined` in `buildWhereClause` + Supertest test added. |
| 5 | **Medium (Docs)** | `openapi.json` | Spec drifted from code: `CreateTicketRequest`/`UpdateTicketRequest` bounds & fields, missing `400` on `GET /tickets`, missing `403` on `PATCH /tickets/{id}`, `AuthResponse` using `token` instead of `accessToken`, `RegisterResponse` mismatch, `Comment.author` missing `email`, `Ticket` missing `category`/`comments`. | **Fixed (`deda957`):** Synchronized `openapi.json` schemas, response envelopes, and status codes with Zod validators and repositories. |
| 6 | **Low/Med (Bug)** | `ticket.service.ts` | Reopening a resolved/closed ticket to `waiting_on_customer` left stale `resolvedAt`/`closedAt` timestamps set. | **Fixed (`deda957`):** Added `'waiting_on_customer'` to timestamp reset check + unit test added. |
| 7 | **Medium (Concurrency)** | `ticket.service.ts`, `ticket.repository.ts` | `ticketRepository.count()` ignored soft-deleted tickets (`deletedAt: null`), risking `reference` collisions after soft deletes. | **Fixed (`deda957`):** `count(includeDeleted = false)` added and `createTicket` calls `count(true)`. *(Concurrent DB sequence retry noted as future enhancement.)* |
| 8 | **Low/Med (Security)** | `ticket.service.ts` | `getAllTickets` failed open (unscoped) if called without `currentUser`. | **Fixed (`deda957`):** Both `getAllTickets` and `getTicketById` fail closed with `UnauthorizedError` if `!currentUser` + unit test added. |
| 9 | **Low (Duplication)** | `ticket.controller.ts`, `comment.controller.ts` | Duplicated `parseId` helper across both controllers. | **Fixed (`deda957`):** Extracted shared `parseIdParam` in `src/utils/params.util.ts`. |
| 10 | **Design Question** | `ticket.routes.ts`, `ticket.service.ts` | Customers can `PATCH /tickets/:id` status (including `'resolved'`/`'closed'`). | **Documented:** Preserved existing Day 10/11 behavior pending product/lead confirmation. |

---

## 3. Quality Gate Verification (After Final Code Edits)

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript Check | `npx tsc --noEmit` (`apps/api`) | **PASS** — 0 errors |
| Full Jest Suite + Coverage | `npm run test:coverage` (`apps/api`) | **PASS** — **6 / 6 suites**, **86 / 86 tests** (`79` Day 11 baseline + `7` review regression tests) |
| Service Coverage (`src/services/`) | `jest --coverage` | **92.7%** Stmts \| **87.5%** Branches \| **100%** Funcs \| **95.45%** Lines |
| Day 10 Security Regression (Dev DB) | `npm run test:day10` (`apps/api`) | **PASS** — **19 / 19** checks passed |
| Postman / Newman End-to-End Demo | `npx ts-node run-day12-demo.ts` (`apps/api`, port `3007`, isolated test DB) | **PASS** — **14 / 14 requests**, **17 / 17 assertions**, **0 failed** (avg `19ms`) |

---

## 4. Postman API Demo Assets (`Phase 5`)
- **Collection:** `postman/SupportDesk_Day12_API_Demo.postman_collection.json`
- **Automated Runner:** `apps/api/run-day12-demo.ts` (uses `NODE_ENV=test` + `resetAndSeedDatabase()` so dev data stays untouched)
- **End-to-End Flow Verified:**
  1. `GET /health` -> `200 OK` standard `{ data, error: null, meta }` envelope
  2. `GET /docs/` -> `200 OK` interactive Swagger UI HTML
  3. `POST /auth/login` (Customer & Agent JWT token issuance)
  4. `POST /tickets` as customer (verifies spoofed `customerId: 9999` is ignored)
  5. `GET /tickets` customer ownership scoping + pagination metadata + agent search & filter (`search`, `priority`)
  6. `POST /tickets/:id/comments`: customer public comment (`201`), customer `isInternal: true` (`403`), agent `isInternal: true` (`201`)
  7. `GET /tickets/:id`: customer receives public comments only; agent receives internal + public notes
  8. `GET /tickets?sortBy=password_hash` -> `400 VALIDATION_ERROR`; `DELETE /tickets/:id` as customer -> `403 FORBIDDEN`

---

## 5. Week 2 Backend Architecture Summary (Days 7–12)

### 5.1 Request Lifecycle (Route -> DB -> Response)
1. **Security & App Middleware (`app.ts`):** `helmet` security headers, allowlisted `cors`, `express.json`, safe `requestLogger`, Swagger UI (`/docs`, `/docs.json`).
2. **Routes & Validation (`routes/`, `middlewares/`):** `requireAuth` (Bearer JWT verification) -> `requireRole` (RBAC guard) -> `validateParams` / `validateQuery` (stored on `res.locals.validatedQuery`) / `validateBody` (Zod schemas).
3. **Controllers (`controllers/`):** Read `parseIdParam`, validated query/body payloads, and `req.user`, delegate to services, and wrap success responses in `{ data, error: null, meta }`.
4. **Services (`services/`):** Enforce customer ownership scoping (`customerId = currentUser.id`), internal note confidentiality (`filterCommentsForRole` & `includeInternal`), state transition timestamps, and throw typed `AppError` subclasses (`NotFoundError`, `ForbiddenError`, `BadRequestError`, `UnauthorizedError`).
5. **Repositories (`repositories/`):** Sole Prisma boundary (`prisma.client.ts`), enforcing `deletedAt: null` soft-delete guards, allowlisted sort fields, case-insensitive multi-field search, and scoped pagination `total`.
6. **Central Error Handler (`middlewares/error.middleware.ts`):** Maps Zod, domain `AppError`, and unexpected errors into `{ data: null, error: { code, message, details? }, meta: {} }` without exposing secrets or stack traces.

### 5.2 Week 2 Daily Progression Roll-Up

| Day | Focus Area | Primary Output Document |
| --- | --- | --- |
| **Day 7** | Clean Code & MVC Fundamentals (`messy-express-app.js` refactor) | `docs/day-7/SupportDesk_Day7_Architecture_Note_EOD.md` |
| **Day 8** | PostgreSQL + Prisma Schema, Migrations & 50-Ticket Seed | `docs/day-8/SupportDesk_Day8_EOD_Report.md` |
| **Day 9** | Express + TypeScript 4-Layer API Skeleton, Zod & Postman Suite | `docs/day-9/SupportDesk_Day9_EOD_Report.md` |
| **Day 10** | JWT Auth, bcrypt, RBAC, Ownership Scoping, Helmet/CORS & Rate Limit | `docs/day-10/SupportDesk_Day10_EOD_Report.md` |
| **Day 11** | Ticket Querying, Comments, OpenAPI `/docs`, Isolated Test DB & Tests | `docs/day-11/SupportDesk_Day11_EOD_Report.md` |
| **Day 12** | Code Review (PR `#26`), Security/Bug Fixes, Postman Demo & Week 2 Summary | `docs/day-12/SupportDesk_Day12_EOD_Report.md` |

---

## 6. Week 2 Quiz Reference & Retrospective Summary

### 6.1 Week 2 Technical Quiz Check (SupportDesk Architecture)
1. **Why return `404` instead of `403` when a customer requests another customer's ticket/comments?**  
   Returning `404 Not Found` prevents IDOR enumeration attacks where an attacker probes sequential IDs to confirm which ticket IDs exist in the system.
2. **Why confine Prisma imports to `src/repositories/`?**  
   Isolating ORM queries inside repositories keeps domain rules unit-testable with mocked repositories (no real DB needed) and prevents soft-delete or scoping filters from scattering across controllers.
3. **Why did `validateQuery` previously lose Zod `.trim()` and numeric transforms?**  
   Calling `schema.parse(req.query)` without storing its return value discarded parsed defaults and trims because Express 5's `req.query` is read-only; storing on `res.locals.validatedQuery` preserves the sanitized object.
4. **What vulnerability existed on `GET /tickets/:id` prior to PR `#26` fix `deda957`?**  
   `TicketRepository.findById` eagerly included all non-deleted comments while `TicketService.getTicketById` returned the record unfiltered, exposing `isInternal: true` agent notes to customers.
5. **Why does `setup-test-db.ts` assert `DATABASE_URL` contains `_test` before truncating?**  
   Fail-fast DB guard ensures `TRUNCATE ... RESTART IDENTITY CASCADE` can never accidentally wipe the development database (`supportdesk`).

### 6.2 Week 2 Retrospective (`Keep / Start / Stop` — Draft Summary)
- **Keep:** Running isolated database fixtures (`supportdesk_test`), Zod boundary validation, and Newman/Supertest end-to-end assertions after every security/API change.
- **Start:** Adding endpoint-level checklist checks (checking `GET /tickets/:id` nested relations alongside sub-routes) and comparing OpenAPI schemas directly against Zod definitions before opening PRs.
- **Stop:** Relying solely on sub-resource endpoint tests when parent detail endpoints (`GET /tickets/:id`) also serialize nested child collections.

---

## 7. Day 12 Definition of Done (DoD) Checklist

| Criterion | Status | Evidence |
| --- | --- | --- |
| Focused PR opened & documented | **PASS** | GitHub PR `#26` (`feature/day-11-query-docs-tests` -> `main`) |
| Human + AI code review completed & compared | **PASS** | 10 real findings audited; human checklist & AI comparison documented in Section 2 |
| Valid review defects fixed & regression tested | **PASS** | Commit `deda957` fixed 9 defects; +7 new unit/Supertest tests added |
| TypeScript & all test gates green after final edits | **PASS** | `tsc --noEmit` (0 errors), `86/86` Jest tests (`92.7%` service stmts), `19/19` Day 10 suite |
| End-to-end Postman API demo verified | **PASS** | `run-day12-demo.ts`: `14/14` requests, `17/17` assertions, `0` failures |
| Day 12 EOD & Week 2 Summary completed | **PASS** | `docs/day-12/SupportDesk_Day12_EOD_Report.md` |
| Remote branches synced (`git push`) | **READY (Manual Push)** | Run `git push origin feature/day-11-query-docs-tests` and `git push origin samarth` |
