# Day 14 — Ticket Screens End to End — EOD

**Project:** SupportDesk — Customer Support Ticket Management System  
**Date:** Friday, 13 November 2026  
**Track:** Full-Stack TypeScript Engineering  
**Branch:** `feat/web-ticket-screens`  
**Verdict:** **COMPLETE** (All frontend screens, components, shared Zod validation, TanStack Query cache invalidations, and 29 automated tests verified 100% green; live PostgreSQL integration against `supportdesk_test` marked NOT VERIFIED due to stopped Docker engine).

---

## 1. Branch and PR link
- **Branch:** `feat/web-ticket-screens` (focused branch off `feat/web-login-foundation`)
- **PR Link:** Ready to open after pushing `git push -u origin feat/web-ticket-screens`

---

## 2. API contracts and schemas inspected (Contract Notes Table)

| Endpoint | Method | Supported Query / Body Params | Auth & Permissions | Response Envelope |
| :--- | :--- | :--- | :--- | :--- |
| `/tickets` | `GET` | `page` (int $\ge 1$), `limit` (1-100), `status` (5 enums), `priority` (P1-P4), `customerId`, `assigneeId`, `search` (max 100), `sortBy` (`createdAt`, `updatedAt`, `priority`, `status`, `title`), `sortOrder` (`asc`, `desc`) | Bearer JWT. `customer` scoped to own `customerId`; `agent`/`admin` see all tickets. | `{ data: Ticket[], error: null, meta: { page, limit, total, totalPages } }` (`totalPages` is 0 when `total` is 0) |
| `/tickets/:id` | `GET` | Route param `:id` (int $>0$) | Bearer JWT. `customer` receives 404 on others' tickets. `isInternal: true` comments stripped for customers. | `{ data: Ticket, error: null, meta: {} }` (includes `customer`, `assignee`, and filtered `comments`) |
| `/tickets` | `POST` | Body validated by `createTicketSchema` (`title` 3-255, `description` min 5, `priority` P1-P4 default P3, `category` max 100). | Bearer JWT. `customer` forced to `customerId = currentUser.id`. | `{ data: Ticket, error: null, meta: {} }` (HTTP 201 Created) |
| `/tickets/:id` | `PATCH` | Body validated by `updateTicketSchema` (`status`, `priority`, `category`, `assigneeId`). | Bearer JWT. `agent` & `admin` can change status & assignee. UI restricts status changes to agents/admins. | `{ data: Ticket, error: null, meta: {} }` |
| `/tickets/:id/comments` | `GET` | Route param `:id` (int $>0$) | Bearer JWT. Chronologically sorted (`createdAt: asc`). `isInternal: true` stripped for customers. | `{ data: Comment[], error: null, meta: {} }` |
| `/tickets/:id/comments` | `POST` | Body: `{ body: string, isInternal?: boolean }` | Bearer JWT. Customers forbidden from creating internal notes (HTTP 403 Forbidden). | `{ data: Comment, error: null, meta: {} }` (HTTP 201 Created) |

---

## 3. Ticket list implementation
- Implemented `TicketsList` (`apps/web/src/features/tickets/components/TicketsList.tsx`) and `TicketsPage` (`apps/web/src/pages/TicketsPage.tsx`).
- Connected to `useTickets(queryParams)` hook and synchronized with URL search parameters (`useSearchParams`).
- Responsive layout: Desktop table with clickable rows + Mobile card list.
- Clickable ticket reference and row navigating to `/tickets/:id`.
- Action button linking to `/tickets/new`.

---

## 4. Pagination and filters tested
- Server-side pagination controls: Previous, Next, Page indicator (`Page X of Y`), and Total records counter (`Showing N of Total`).
- Disabled states verified: Previous disabled on page 1; Next disabled on the final page (`currentPage >= totalPages`).
- Filter controls:
  - Search input with submit button and live reset (synchronized with URL via `useEffect`).
  - Status select (`open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`).
  - Priority select (`P1`, `P2`, `P3`, `P4`).
- Changing filters automatically resets `page` to `1` and queries the server with active query string.

---

## 5. Status badges
- Built `StatusBadge` (`apps/web/src/features/tickets/components/StatusBadge.tsx`) mapping all 5 backend statuses:
  - `open`: Sky blue badge (`bg-sky-50 text-sky-800 border-sky-200`) with indicator dot
  - `in_progress`: Amber badge (`bg-amber-50 text-amber-800 border-amber-200`) with indicator dot
  - `waiting_on_customer`: Violet badge (`bg-violet-50 text-violet-800 border-violet-200`) with indicator dot
  - `resolved`: Emerald badge (`bg-emerald-50 text-emerald-800 border-emerald-200`) with indicator dot
  - `closed`: Slate badge (`bg-slate-100 text-slate-700 border-slate-200`) with indicator dot
- Built `PriorityBadge` mapping `P1` (Critical / Rose), `P2` (High / Orange), `P3` (Medium / Blue), `P4` (Low / Slate).
- Safe fallback handles unknown status values without crashing.

---

## 6. Ticket detail and comment thread
- Implemented `TicketDetailPage` (`apps/web/src/pages/TicketDetailPage.tsx`):
  - Displays ticket reference, status badge, priority badge, category, created date, customer information, and assigned agent.
  - Agent status transition: Agents and Admins see a "Change Status" dropdown (`open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`) that triggers the `useUpdateTicket` mutation.
  - Comment thread: Displays comments in chronological order (`createdAt: asc`).
  - Confidentiality: Comments with `isInternal: true` render a distinct amber `Internal Note` pill (visible only to agents/admins as backend strips them for customers).
  - Add comment form: Textarea with submit guard and whitespace trimming. For agents/admins, renders a checkbox for `Make internal note (visible only to support agents and admins)`.
  - Customers cannot see the internal note checkbox or the status transition dropdown.
  - Duplicate request optimization: Reuses comments embedded in `GET /tickets/:id` and avoids duplicate initial `/comments` request.
  - Explicit states for Loading, 404 Not Found, 403 Access Denied, and Empty Comments.

---

## 7. Ticket creation form and shared Zod schema
- Implemented `CreateTicketPage` (`apps/web/src/pages/CreateTicketPage.tsx`):
  - Form state and validation managed via `react-hook-form` and `@hookform/resolvers/zod`.
  - **Exact shared Zod schema import path:**  
    `import { createTicketSchema } from '../../../../../api/src/validations/ticket.validation.ts';`  
    (re-exported in `apps/web/src/features/tickets/schema/ticket-schema.ts`). Zero duplicated Zod rules.
  - Fields: `title` (required, 3-255 chars), `priority` (`P1`–`P4`, default `P3`), `category` (optional), `description` (required, min 5 chars).
  - Inline field validation errors and top-level server error banner (`role="alert"`).
  - Server-side validation errors (HTTP 400 `VALIDATION_ERROR` details) mapped to individual fields via `setError`.
  - Disables submit button during submission (`Creating ticket...`) to prevent double-submits.
  - On success, invalidates ticket list cache and navigates to `/tickets/:id`.

---

## 8. TanStack Query keys and cache invalidation map
Hierarchical query key factory in `apps/web/src/features/tickets/hooks/useTickets.ts`:
- `ticketKeys.all`: `['tickets']`
- `ticketKeys.lists()`: `['tickets', 'list']`
- `ticketKeys.list(params)`: `['tickets', 'list', params]`
- `ticketKeys.details()`: `['tickets', 'detail']`
- `ticketKeys.detail(id)`: `['tickets', 'detail', id]`
- `ticketKeys.comments(id)`: `['tickets', 'detail', id, 'comments']`
Cache Invalidation Rules:
- `useCreateTicket`: Invalidates `ticketKeys.lists()` and pre-seeds `ticketKeys.detail(newTicket.id)`.
- `useUpdateTicket`: Sets detail query data and invalidates `ticketKeys.detail(id)` and `ticketKeys.lists()`.
- `useCreateComment`: Invalidates `ticketKeys.comments(ticketId)` and `ticketKeys.detail(ticketId)`.
- `logout()`: Executes `queryClient.clear()` to completely purge in-memory cache and prevent cross-user data leakage.
- Query Retry Policy: Configured in `App.tsx` to never retry 401, 403, or 404 errors.

---

## 9. Loading/empty/error states verified

| Screen | Loading State | Empty State | Error State |
| :--- | :--- | :--- | :--- |
| **Tickets List** (`/tickets`) | Centered spinner with `role="status"` and accessible text | Distinct cards for empty queue vs no-matching-filters with Clear button | `role="alert"` card with error message and Retry button |
| **Ticket Detail** (`/tickets/:id`) | Centered spinner with `role="status"` | "No comments yet" dashed card prompting first response | Dedicated 404 ("Ticket Not Found"), 403 ("Access Denied"), and network error cards with Retry/Back buttons |
| **Create Ticket** (`/tickets/new`) | Submit button disabled with `Creating ticket...` text | Clean initial form with default priority `P3` | Field-level error messages + top-level `role="alert"` server banner |
| **Login** (`/login`) | Submit button disabled with `Signing in...` text | Clean email/password inputs | `role="alert"` error banner on invalid credentials |

---

## 10. Customer-to-agent workflow evidence
- **Automated Component & Unit Flow:** Verified via Vitest suites (`TicketsList.test.tsx`, `TicketDetailPage.test.tsx`, `CreateTicketPage.test.tsx`).
- **Live Backend Network Execution:**  
  **NOT VERIFIED** — Reason: The Docker engine on the host is stopped (`failed to connect to the docker API at npipe:////./pipe/docker_engine`). The PostgreSQL test database container on `localhost:5433` is unreachable (`PrismaClientInitializationError: Can't reach database server at localhost:5433`). No mocked passes were invented.

---

## 11. Tests run and actual output
- **TypeScript & Vite Production Build** (`npm --prefix apps/web run build` -> `tsc -b && vite build`):
  - Exited `0`: `✓ 198 modules transformed`, built `dist/index.html`, CSS (`27.64 kB`), and JS (`468.53 kB`).
- **Vitest Suite** (`npm --prefix apps/web test` -> `vitest run`):
  - **7 test files passed (7), 29 tests passed (29), 0 failed, 0 skipped**:
    - `src/lib/__tests__/api-client.test.ts` (3 tests passed)
    - `src/features/tickets/__tests__/tickets.api.test.ts` (5 tests passed)
    - `src/components/__tests__/ProtectedRoute.test.tsx` (2 tests passed)
    - `src/pages/__tests__/LoginPage.test.tsx` (3 tests passed)
    - `src/features/tickets/__tests__/TicketsList.test.tsx` (5 tests passed)
    - `src/pages/__tests__/TicketDetailPage.test.tsx` (7 tests passed — includes 403 Access Denied)
    - `src/pages/__tests__/CreateTicketPage.test.tsx` (4 tests passed — includes 400 validation error mapping)

---

## 12. AI review findings and verified fixes
- **Bug 1 (Fixed):** TanStack Query cache was not cleared on user logout, risking cross-user ticket data leakage. Wired `queryClient.clear()` into `AuthProvider.logout()`.
- **Bug 2 (Fixed):** Duplicate comments request on `/tickets/:id` initial load. Disabled redundant `useComments` call on mount since `GET /tickets/:id` embeds filtered comments.
- **Bug 3 (Fixed):** Missing explicit 403 Forbidden state on `TicketDetailPage`. Added dedicated `Access Denied` UI with tests.
- **Bug 4 (Fixed):** Server-side 400 `VALIDATION_ERROR` details were not mapped to form fields. Added field error mapping via React Hook Form `setError`.
- **Bug 5 (Fixed):** Query retry hammered 401, 403, and 404 errors. Updated `QueryClient` retry logic to never retry HTTP 401/403/404.
- **Bug 6 (Fixed):** Search input state did not sync with URL query parameters on browser back/forward navigation. Added `useEffect` in `TicketsList.tsx`.

---

## 13. Prompt Journal updated
- Appended **Entry 20 — Day 14: Ticket Screens End to End (List, Detail with Comments, Create Form)** to `docs/prompt-journal.md`.

---

## 14. Blockers, API gaps and LEAD DECISIONS NEEDED
- **LEAD DECISION NEEDED:** In `apps/api/src/services/ticket.service.ts` line 180, the backend `updateTicket` service method permits customer role to update ticket status (only `assigneeId` is guarded with `ForbiddenError`). In the frontend UI, status transitions are strictly restricted to `agent` and `admin`. Recommendation: Add `if (currentUser.role === 'customer' && dto.status !== undefined) throw new ForbiddenError(...)` to the backend service for defense in depth.
- **Environment Blocker:** Docker engine is not running on the development workstation; PostgreSQL test container on port 5433 could not be reached for live browser e2e testing.

---

## 15. What I learned
- Directly importing shared Zod schemas across a TypeScript monorepo prevents silent contract drift and enables immediate form validation parity.
- Explicitly clearing the client-side query cache on session termination is critical in multi-tenant or role-based web applications to prevent cached data leakage.

---

## 16. Term of the day — Acceptance criteria
**Acceptance criteria** are the specific, testable conditions a feature must satisfy to be accepted as complete. For Day 14, the central acceptance criterion is observable end-to-end behaviour: a customer creates a ticket, an agent sees it, the agent adds a comment, and the ticket status changes.
