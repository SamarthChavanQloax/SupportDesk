# Day 12 — Code Review Day — EOD / Week 2 Report

**Project:** SupportDesk — Customer Support Ticket Management API  
**Date:** Wednesday, 11 November 2026 (Curriculum: Week 2 — Day 6 / Overall Day 12)  
**Branches:** `feature/day-11-query-docs-tests`, `samarth`  

---

1. **Review partner:**  
   None assigned in this session (conducted structured self-diff peer review workflow on own open Week 2 PR `#26`).

2. **PR reviewed:**  
   [PR #26 (`feature/day-11-query-docs-tests` -> `main`)](https://github.com/SamarthChavanQloax/SupportDesk/pull/26) — Day 11 Ticket Querying, Comments, OpenAPI `/docs`, and Isolated Test Suite (`7` baseline commits, `43` files changed, `+11,439 / -1,053`; code-only `27` files, `+2,254 / -16`).

3. **Requirements/acceptance criteria checked:**  
   - Correctness, pagination/filter/search edge cases, and `{ data, error, meta }` response envelope parity  
   - Strict 4-layer MVC boundaries (`routes -> controllers -> services -> repositories`, Prisma confined to `src/repositories/`)  
   - RBAC, ownership scoping, and internal comment confidentiality (`isInternal: true` restricted to `agent`/`admin`)  
   - Zod input validation, error handling, OpenAPI spec accuracy, TypeScript strict build, and >= 70% service test coverage  

4. **Number of meaningful review comments submitted:**  
   10 actionable findings identified against PR `#26` (9 code/documentation defects + 1 product design escalation question).

5. **Main human review findings:**  
   Completed human inspection of PR `#26` (`Files changed`) using the Day 12 checklist: verified branch scoping cleanliness, PR title/description hygiene, runtime `/docs` redirect vs. 404 behavior, route middleware ordering (`requireAuth -> requireRole -> validate*`), isolated test database safety (`_test` guard), and end-to-end Postman/DB workflows.

6. **ChatGPT / AI review findings:**  
   AI second-pass code inspection surfaced 10 concrete line-level issues:  
   - **#1 Critical (Security):** `GET /tickets/:id` (`TicketRepository.findById` + `TicketService.getTicketById`) eagerly returned all non-deleted `comments` without stripping `isInternal: true` notes for customers (`filterCommentsForRole` was unused in `src/`).  
   - **#2 Medium (Bug):** `TicketRepository.findManyWithPagination` used `Math.ceil(total / limit) || 1`, returning `totalPages: 1` when `total === 0`.  
   - **#3 Medium (Design):** `validateQuery` discarded Zod's parsed output (`schema.parse(req.query)`), causing manual query parsing and untrimmed `search` in `ticket.controller.ts` (plus redundant `if/else` in `validateBody`).  
   - **#4 Medium (Bug):** `ticketQuerySchema` allowed `0` for `customerId`/`assigneeId` (`/^\d+$/`) and `buildWhereClause` used truthy checks instead of `!== undefined`.  
   - **#5 Medium (Docs):** `openapi.json` drifted from Zod/runtime (`AuthResponse` `token` vs. `accessToken`, `RegisterResponse` shape, `CreateTicketRequest`/`UpdateTicketRequest` bounds & fields, missing `400` on `GET /tickets`, missing `403` on `PATCH /tickets/{id}`, `Comment.author.email`, `Ticket` `category`/`comments`).  
   - **#6 Low/Med (Bug):** Transitioning a resolved/closed ticket to `waiting_on_customer` left stale `resolvedAt`/`closedAt` timestamps set.  
   - **#7 Medium (Concurrency/Data):** `ticketRepository.count()` ignored soft-deleted tickets (`deletedAt: null`), risking `TCK-YYYY-NNNN` reference collisions after soft deletes.  
   - **#8 Low/Med (Security):** `TicketService.getAllTickets` failed open (unscoped) if invoked with `currentUser = undefined`.  
   - **#9 Low (Duplication):** Duplicated `parseId` helper across `ticket.controller.ts` and `comment.controller.ts`.  
   - **#10 Question (Product Rule):** `PATCH /tickets/:id` allows customers to transition ticket `status` (including `'resolved'`/`'closed'`), whereas `assigneeId` changes return `403`.  

7. **Human vs AI comparison:**  
   Human review validated checklist alignment, PR scope/metadata, live `/docs` & Postman workflows, and DB isolation; AI second review traced cross-layer call chains in code to catch the nested `GET /tickets/:id` internal-comment leak, Express 5 discarded `req.query` coercion, `total === 0` pagination arithmetic, and exact JSON schema drifts in `openapi.json`.

8. **AI false positives or unsupported findings:**  
   Finding **#10** (restricting customer status changes on `PATCH /tickets/:id`) was not treated as an automatic bug because blocking customers from closing/updating their own ticket could break intended Day 10/11 acceptance behavior without lead confirmation.

9. **Valid review comments fixed:**  
   Fixed all **9 valid defects** in commit `deda957` on `feature/day-11-query-docs-tests` (and fast-forward merged to `samarth`):  
   - Wired `filterCommentsForRole` into `TicketService.getTicketById` so customers never see `isInternal: true` comments on `GET /tickets/:id`  
   - Fixed `totalPages = total === 0 ? 0 : Math.ceil(total / limit)`  
   - Updated `validateQuery` to store Zod output on `res.locals.validatedQuery` for `getTickets`; simplified `validateBody`  
   - Extracted shared `parseIdParam` into `apps/api/src/utils/params.util.ts`  
   - Added `min(1)` on `customerId`/`assigneeId` in `ticketQuerySchema` and `!== undefined` in `buildWhereClause`  
   - Reset `resolvedAt`/`closedAt` when reopening to `waiting_on_customer`  
   - Required `currentUser` in `getAllTickets` and `getTicketById` (`UnauthorizedError` if omitted)  
   - Updated `ticketRepository.count(true)` for reference generation to account for soft-deleted tickets  
   - Synchronized `apps/api/src/docs/openapi.json` with Zod schemas, response payloads, and error codes  

10. **Comments answered with technical reasons:**  
    - **Reference race condition (#7):** Switched `createTicket` to `count(true)` so soft deletes no longer cause collisions, while noting that replacing `count() + 1` with a DB sequence was deferred cleanly to avoid altering the frozen Prisma schema during Day 12.  
    - **Customer `PATCH /tickets/:id` status (#10):** Kept existing behavior intact pending product sign-off rather than breaking Day 10/11 compatibility silently.  

11. **Comments escalated to lead:**  
    - Confirm whether customers should remain allowed to update `status` to `'resolved'`/`'closed'` via `PATCH /tickets/:id`.  
    - Confirm whether an additional partner PR review assignment is needed for cohort sign-off before merging PR `#26`.  

12. **Tests run after fixes and actual result:**  
    - `npx tsc --noEmit` (`apps/api`): **PASS** (`0` errors)  
    - `npm run test:coverage` (`apps/api`): **PASS** — **6 / 6 suites**, **86 / 86 tests passed** (`79` baseline + `7` new regression tests covering `GET /tickets/:id` comment filtering, `totalPages=0`, `customerId=0`/`assigneeId=0`, fail-closed `getAllTickets`, and `waiting_on_customer` timestamp reset)  
    - `npm run test:day10` (`apps/api`, dev DB): **PASS** — **19 / 19 checks passed**  
    - `npx ts-node run-day12-demo.ts` (`apps/api`, isolated `supportdesk_test` DB on port `3007`): **PASS** — **14 / 14 requests**, **17 / 17 assertions**, **0 failed** (avg `19ms`)  

13. **Postman demo flows completed:**  
    Executed full end-to-end collection [`postman/SupportDesk_Day12_API_Demo.postman_collection.json`](../../postman/SupportDesk_Day12_API_Demo.postman_collection.json) via [`apps/api/run-day12-demo.ts`](../../apps/api/run-day12-demo.ts):  
    1. Health envelope (`GET /health`) & Swagger UI (`GET /docs/`)  
    2. Customer & Agent JWT login (`POST /auth/login`)  
    3. Customer ticket creation (`POST /tickets`) verifying spoofed `customerId: 9999` is ignored  
    4. Customer scoped listing & pagination (`GET /tickets?page=1&limit=2`) + Agent search/priority filtering (`?search=Payment&priority=P1`)  
    5. Public comment creation (`201`), blocked customer `isInternal: true` (`403`), agent `isInternal: true` (`201`)  
    6. Detail & comment visibility check (`GET /tickets/:id` strips internal notes for customer, includes them for agent)  
    7. Sort allowlist validation (`400`) & RBAC delete block (`403`)  

14. **401 / 403 evidence:**  
    - **`401 Unauthorized`:** Verified in Supertest (`GET /tickets`, `GET /tickets/:id/comments`, `POST /tickets/:id/comments` without Bearer token -> `401 UNAUTHORIZED`) and Day 10 `AUTH-08..10` (`401` on missing, malformed, and invalid-signature JWTs).  
    - **`403 Forbidden`:** Verified in Postman Request `#09` (`POST /tickets/6/comments` with `isInternal: true` as customer -> `403 FORBIDDEN`) and Postman Request `#14` / `AUTH-12` (`DELETE /tickets/:id` as customer -> `403 FORBIDDEN`).  

15. **Ticket ownership and agent access evidence:**  
    - **Customer scoping:** Postman Request `#05` & `#06` verified `POST /tickets` ignores client-supplied `customerId: 9999` and `GET /tickets?page=1&limit=2` returns only the logged-in customer's tickets; Supertest confirmed cross-customer `GET /tickets/:id` and `GET /tickets/:id/comments` return `404 NOT_FOUND` (preventing ID enumeration).  
    - **Agent access:** Postman Request `#07` (`GET /tickets?search=Payment&priority=P1`) returned matching cross-customer tickets (`200 OK`); Day 10 `AUTH-15` confirmed agent sees all `50` dev tickets while customer sees only `17`.  

16. **Querying/comments demo evidence:**  
    - Pagination: `GET /tickets?page=1&limit=2&sortBy=createdAt&sortOrder=desc` -> `200 OK` with `{ page, limit, total, totalPages }` metadata (and Supertest empty search -> `total: 0, totalPages: 0`).  
    - Allowlist validation: `GET /tickets?sortBy=password_hash` -> `400 VALIDATION_ERROR`.  
    - Comment confidentiality: Customer `POST /tickets/6/comments` public (`201`) + Agent `isInternal: true` (`201`), followed by Customer `GET /tickets/6` returning only `isInternal: false` comments (`Request #11`) and Agent `GET /tickets/6` returning both public and internal notes (`Request #12`).  

17. **`/docs` demo result:**  
    - Live check via `curl.exe -i http://localhost:3000/docs` returned `301 Moved Permanently` (`Location: /docs/`).  
    - `curl.exe -i http://localhost:3000/docs/` returned `200 OK` serving Swagger UI HTML (`3106` bytes).  
    - `curl.exe -i http://localhost:3000/docs.json` returned `200 OK` (`application/json`).  
    - Postman Request `#02` asserted `200 OK` and `swagger-ui` HTML presence.  

18. **Week 2 quiz result (if scored):**  
    Not yet scored on an external LMS quiz portal; completed 5-question Week 2 architecture & security self-check in workspace:  
    - `404` vs `403` on cross-customer access prevents IDOR enumeration; Prisma isolation in `src/repositories/` keeps domain rules unit-testable; Express 5 requires `res.locals.validatedQuery` to preserve Zod `.trim()`/numeric transforms; `GET /tickets/:id` nested comments needed `filterCommentsForRole`; `assertTestDatabase()` blocks `TRUNCATE` unless `DATABASE_URL` contains `_test`.  

19. **Keep:**  
    Strict 4-layer MVC boundaries, fail-fast isolated `supportdesk_test` fixtures (`assertTestDatabase()`), and running Jest + Supertest + Newman assertions after every security/endpoint fix.  

20. **Start:**  
    Auditing nested relation payloads (`GET /tickets/:id` comments) alongside sub-resource routes, and verifying `openapi.json` contracts line-by-line against Zod schemas before opening PRs.  

21. **Stop:**  
    Assuming validation middleware mutates Express 5 `req.query` in place, or leaving tested security helpers (`filterCommentsForRole`) unconnected to parent endpoints.  

22. **Week 2 PR links:**  
    - [PR #15 (`SamarthChavanQloax/samarth` -> `main`)](https://github.com/SamarthChavanQloax/SupportDesk/pull/15) — Week 2 Day 9/10 foundation merged to `main` (`21cb449`)  
    - [PR #26 (`feature/day-11-query-docs-tests` -> `main`)](https://github.com/SamarthChavanQloax/SupportDesk/pull/26) — Day 11 querying/comments/OpenAPI/tests + Day 12 code-review fixes & demo (`deda957`..`732450e`)  

23. **Week 2 test/coverage evidence:**  
    - **Jest Coverage (`npm run test:coverage`):** **6 / 6 suites, 86 / 86 tests passed** (`92.7%` Statements, `87.5%` Branches, `100%` Functions, `95.45%` Lines across `src/services/`: `auth.service.ts` 100%, `comment.service.ts` 100%, `ticket.service.ts` 88.37% stmts / 92.59% lines).  
    - **TypeScript (`npx tsc --noEmit`):** 0 errors.  
    - **Day 10 Security Suite (`npm run test:day10`):** **19 / 19 passed**.  
    - **Day 12 Postman/Newman Demo (`run-day12-demo.ts`):** **14 / 14 requests, 17 / 17 assertions, 0 failed**.  

24. **Blockers or unfinished work:**  
    - No peer partner was assigned for reciprocal PR review; awaiting lead sign-off before merging PR `#26` and confirmation on Finding #10 (customer `PATCH /tickets/:id` status transitions).  
    - External LMS quiz/retrospective portal submission and any live screen-share Postman walkthrough remain external to this repository.  

25. **Three things learned:**  
    1. Protecting a dedicated sub-route (`GET /tickets/:id/comments`) fails if a parent endpoint (`GET /tickets/:id`) eagerly includes the same child records without applying role visibility filtering.  
    2. In Express 5, `req.query` is a read-only getter, so calling `schema.parse(req.query)` without saving to `res.locals` silently drops Zod trims, defaults, and numeric coercion.  
    3. Diffing `openapi.json` directly against Zod validators and repository `select` clauses catches subtle API contract mismatches (`token` vs `accessToken`, missing `400`/`403` responses, field length limits) early.  

26. **One improvement goal for Week 3:**  
    Write negative/boundary contract tests (`totalPages=0`, `0`/out-of-range filters, nested child-relation visibility, and OpenAPI schema parity checks) for every new endpoint before opening each PR.  
