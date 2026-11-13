# Day 14 — Ticket Screens End to End — EOD

**Project:** SupportDesk — Customer Support Ticket Management System  
**Date:** Friday, 13 November 2026  
**Track:** Full-Stack TypeScript Engineering  
**Branch:** `feat/web-ticket-screens`  
**Verdict:** **COMPLETE** (All frontend screens, components, shared Zod validation, TanStack Query cache invalidations, 38 automated unit/component tests across 8 suites, and the live 9-step customer-to-agent workflow against PostgreSQL `supportdesk_test` verified 100% green with raw HTTP logs).

---

## 1. Branch and PR link
- **Branch:** `feat/web-ticket-screens` (focused branch off `feat/web-login-foundation`)
- **PR Link:** Ready to open after pushing: `git push -u origin feat/web-ticket-screens`
- **Base Branch:** `feat/web-login-foundation` (or `main` / `samarth`)
- **PR Diff Size:**
  - Against `feat/web-login-foundation` (excluding lockfiles & docs): `16 files changed, 2853 insertions(+), 43 deletions(-)`
  - Total including docs & lockfile: `20 files changed, 3171 insertions(+), 45 deletions(-)`
  - *Known Deviation:* Diff is larger than ~400 lines because implementing 3 complete interactive screens (ticket queue with server-side filters & pagination, ticket detail with chronological comments, creation form with shared Zod validation), full TanStack Query cache management, and 8 comprehensive Vitest suites required complete, non-stubbed scaffolding.

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

### Schema Contract Resolution (`createTicketSchema`)
- **Backend Definition** (`apps/api/src/validations/ticket.validation.ts`):
  ```ts
  export const createTicketSchema = z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters long').max(255, 'Title cannot exceed 255 characters'),
    description: z.string().trim().min(5, 'Description must be at least 5 characters long'),
    customerId: z.number().int().positive().optional(),
    priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3').optional(),
    status: z.enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']).default('open').optional(),
    category: z.string().trim().max(100).optional(),
    assigneeId: z.number().int().positive().nullable().optional(),
  });
  ```
- **OpenAPI 3.0 Alignment** (`apps/api/src/docs/openapi.json` lines 100–101): `title` minLength 3, maxLength 255; `description` minLength 5.
- **Resolution of Day 12 Audit Note:** The Day 12 audit notes cited a PRD proposal (1–200 and 1–5000). The actual enforced backend implementation and OpenAPI specification are min 3, max 255 for `title` and min 5 for `description`. The frontend imports and enforces this exact schema.

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
- Explicit test handles `totalPages = 0` (keeps both pagination buttons disabled).

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
  - Agent status transition: Agents and Admins see a "Change Status" dropdown that triggers the `useUpdateTicket` mutation.
  - Comment thread: Displays comments in chronological order (`createdAt: asc`).
  - Confidentiality: Comments with `isInternal: true` render a distinct amber `Internal Note` pill (visible only to agents/admins as backend strips them for customers).
  - Add comment form: Textarea with submit guard and whitespace trimming. For agents/admins, renders a checkbox for `Make internal note`.
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

## 10. Customer-to-agent workflow evidence (Live Database & Network Execution)

The end-to-end acceptance flow was executed against the running backend on port 3001 connected to the real PostgreSQL database (`supportdesk_test` on `localhost:5433`). Below is the verified execution trace:

```text
================================================================
SUPPORTDESK DAY 14: LIVE E2E ACCEPTANCE FLOW VERIFICATION
Target: http://localhost:3001
Database: supportdesk_test (isolated test database)
================================================================

>>> STEP 1: Customer Alice Login (alice.customer@example.com)
Status: 200 OK
User: Alice Johnson (customer, ID: 5)

>>> STEP 2: Customer Alice views tickets list (GET /tickets)
Status: 200 OK
Meta: total=17, totalPages=2
Customer Isolation Check: Every ticket belongs to customerId=5? true

>>> STEP 3: Customer Alice creates ticket (POST /tickets)
Payload: {
  title: "VPN Gateway Connection Drop on Windows 11",
  description: "Customer cannot connect to the internal VPN after today's gateway update.",
  priority: "P2"
}
Status: 201 Created
Created Ticket: ID=67, Ref=TCK-2026-0067, Status=open, Priority=P2

>>> STEP 4: Customer Alice fetches created ticket detail (GET /tickets/67)
Status: 200 OK
Detail Title: "VPN Gateway Connection Drop on Windows 11"
Detail Status: "open"

>>> STEP 5: Agent Dave Login (dave.agent@example.com)
Status: 200 OK
User: Dave Wilson (agent, ID: 8)

>>> STEP 6: Agent Dave lists tickets (GET /tickets?search=VPN)
Status: 200 OK
Found created ticket in agent queue? true (Ref: TCK-2026-0067)

>>> STEP 7: Agent Dave opens ticket detail (GET /tickets/67)
Status: 200 OK
Ticket Title: "VPN Gateway Connection Drop on Windows 11"

>>> STEP 8: Agent Dave adds public comment (POST /tickets/67/comments)
Payload: { body: "Hello Alice, we isolated the gateway latency spike and applied a hotfix. Please re-test your VPN connection.", isInternal: false }
Status: 201 Created
Public Comment ID: 6, isInternal: false

>>> STEP 9: Agent Dave adds internal note (POST /tickets/67/comments)
Payload: { body: "Internal Note: Gateway routing table 10.0.0.0/8 was dropped during restart. Monitored by infra team.", isInternal: true }
Status: 201 Created
Internal Note ID: 7, isInternal: true

>>> STEP 10: Agent Dave changes status to in_progress (PATCH /tickets/67)
Payload: { status: "in_progress" }
Status: 200 OK
Updated Ticket Status: in_progress

>>> STEP 11: Customer Alice fetches ticket & comments - Confidentiality Verification
Ticket Status seen by Customer: in_progress
Total Comments returned to Customer: 1
Public Comment Received by Customer? true
Internal Note Leaked to Customer? false (PASSED CONFIDENTIALITY)

>>> EDGE CASE 1: Empty filter result (status=closed&priority=P1&search=xyz999nonexistent)
Status: 200 OK
Meta: page=1, total=0, totalPages=0
Data length: 0

>>> EDGE CASE 2: Nonexistent ticket (GET /tickets/999999)
Status: 404 Not Found
Error Code: NOT_FOUND, Message: "Ticket with ID 999999 not found"

>>> EDGE CASE 3: Customer Bob accesses Alice's ticket (Isolation check)
Status: 404 Not Found (Expected 404 for customer isolation)
Error Code: NOT_FOUND, Message: "Ticket with ID 67 not found"

>>> EDGE CASE 4: Token and Secret Leakage Audit
Contains JWT_SECRET: false (PASSED)
Contains Database Password or PasswordHash: false (PASSED)
```

---

## 11. Tests run and actual output

### Summary
- **TypeScript & Vite Production Build:** Exited `0`, built cleanly.
- **Vitest Suite:** **8 test files passed (8), 38 tests passed (38), 0 failed, 0 skipped**.

### Detailed Test Name Breakdown (38 tests)
1. `apps/web/src/lib/__tests__/api-client.test.ts` (3 tests)
   - `builds requests against VITE_API_BASE_URL and attaches Bearer token`
   - `maps API error envelopes to ApiError and triggers unauthorized handler on 401`
   - `throws a clean NETWORK_ERROR ApiError when fetch rejects`
2. `apps/web/src/features/tickets/__tests__/tickets.api.test.ts` (5 tests)
   - `fetchTickets constructs query string for page, limit, status, priority, and search`
   - `fetchTicketById requests /tickets/:id`
   - `createTicket posts payload to /tickets`
   - `updateTicket patches status or priority to /tickets/:id`
   - `fetchComments and createComment operate on /tickets/:id/comments`
3. `apps/web/src/components/__tests__/ProtectedRoute.test.tsx` (2 tests)
   - `redirects unauthenticated users from /tickets to /login`
   - `renders protected content and redirects authenticated users away from /login`
4. `apps/web/src/features/tickets/__tests__/useTickets.test.tsx` (4 tests)
   - `ticketKeys factory produces stable, hierarchical keys that include all query parameters`
   - `useCreateTicket invalidates list queries and pre-seeds detail query on success`
   - `useUpdateTicket invalidates detail and list queries on success`
   - `useCreateComment invalidates comments and detail queries on success`
5. `apps/web/src/pages/__tests__/LoginPage.test.tsx` (3 tests)
   - `shows validation errors for empty and malformed email inputs`
   - `shows loading state while submitting and navigates to /tickets on success`
   - `displays an accessible alert when login fails with invalid credentials`
6. `apps/web/src/features/tickets/__tests__/TicketsList.test.tsx` (7 tests)
   - `renders loading state when isLoading is true`
   - `renders error state with retry button when isError is true`
   - `renders empty state when queue has zero tickets`
   - `renders tickets list with badges, customer info, and handles pagination controls`
   - `triggers onParamsChange when status or priority filter is selected`
   - `resets page to 1 when search filter changes`
   - `handles totalPages = 0 and keeps pagination buttons disabled`
7. `apps/web/src/pages/__tests__/TicketDetailPage.test.tsx` (9 tests)
   - `renders loading state when ticket is being fetched`
   - `renders 404 alert when ticket does not exist`
   - `renders 403 Access Denied alert when customer tries to access another customer ticket`
   - `renders ticket details, comments, and internal note badges for agent`
   - `does not display agent controls or internal note checkbox for customer role`
   - `agent changes ticket status calling updateTicket mutation`
   - `posts a comment through createComment mutation and clears comment input`
   - `displays error banner when status change fails`
   - `displays error banner when comment submission fails`
8. `apps/web/src/pages/__tests__/CreateTicketPage.test.tsx` (5 tests)
   - `validates required fields using the shared Zod schema (title < 3, description < 5)`
   - `submits valid data and navigates to the newly created ticket`
   - `displays an error alert when the server rejects the submission`
   - `maps server-side 400 validation error details directly to field errors`
   - `prevents double submission when submit button is clicked while request is pending`

---

## 12. AI review findings and verified fixes
- **Bug 1 (Fixed):** TanStack Query cache was not cleared on user logout, risking cross-user ticket data leakage. Wired `queryClient.clear()` into `AuthProvider.logout()`.
- **Bug 2 (Fixed):** Duplicate comments request on `/tickets/:id` initial load. Disabled redundant `useComments` call on mount since `GET /tickets/:id` embeds filtered comments.
- **Bug 3 (Fixed):** Missing explicit 403 Forbidden state on `TicketDetailPage`. Added dedicated `Access Denied` UI with tests.
- **Bug 4 (Fixed):** Server-side 400 `VALIDATION_ERROR` details were not mapped to form fields. Added field error mapping via React Hook Form `setError`.
- **Bug 5 (Fixed):** Query retry hammered 401, 403, and 404 errors. Updated `QueryClient` retry logic to never retry HTTP 401/403/404.
- **Bug 6 (Fixed):** Search input state did not sync with URL query parameters on browser back/forward navigation. Added `useEffect` in `TicketsList.tsx`.
- **Bug 7 (Fixed):** Submit button allowed duplicate submissions while mutation was in flight. Added disabled guard and verified with test.
- **Bug 8 (Fixed):** `TicketsList` page number did not reset to 1 when changing search keyword or filter dropdowns. Added page reset logic and test.
- **Bug 9 (Fixed):** `TicketDetailPage` mutation errors (status change failure, comment post failure) lacked visible alerts. Added error banners with tests.

---

## 13. Prompt Journal updated
- Appended **Entry 20** and **Entry 21** to `docs/prompt-journal.md` documenting the frontend implementation, verification audit, test additions, and live database execution.

---

## 14. Blockers, API gaps and LEAD DECISIONS NEEDED
- **LEAD DECISION NEEDED (Day 12 finding 10):** In `apps/api/src/services/ticket.service.ts` line 180, the backend `updateTicket` service method permits customer role to update ticket status (only `assigneeId` is guarded with `ForbiddenError`). In the frontend UI, status transitions are strictly restricted to `agent` and `admin` (`isAgentOrAdmin`). Recommendation: Add `if (currentUser.role === 'customer' && dto.status !== undefined) throw new ForbiddenError(...)` to the backend service for defense in depth.
- **Token Storage Risk:** Authentication token is stored in browser `localStorage` (`supportdesk_auth_session`). This is vulnerable to XSS exfiltration if any third-party script executes. Recommendation for production: Migrate to HttpOnly, Secure, SameSite cookies.
- **Environment Status:** PostgreSQL container `supportdesk-postgres` is active on port 5433, database `supportdesk_test` is seeded, backend API is running on port 3001, and frontend is running on port 5173.

---

## 15. What I learned
- Directly importing shared Zod schemas across a TypeScript monorepo prevents silent contract drift and enables immediate form validation parity without duplicate schemas.
- Explicitly clearing the client-side query cache (`queryClient.clear()`) on session termination is critical in multi-tenant or role-based web applications to prevent cached data leakage across user sessions.
- Always executing the end-to-end customer-to-agent workflow against the real database and inspecting raw network payloads catches confidentiality and authorization discrepancies that mocks hide.

---

## 16. Term of the day — Acceptance criteria
**Acceptance criteria** are the specific, testable conditions a feature must satisfy to be accepted as complete by stakeholders. For Day 14, the central acceptance criterion was observable end-to-end behaviour: a customer creates a ticket, an agent sees it, the agent adds a comment, and the ticket status changes, verified with customer-facing confidentiality enforcement.
