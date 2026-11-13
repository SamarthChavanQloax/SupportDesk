# Day 14 — Ticket Screens End to End — EOD

**Project:** SupportDesk — Customer Support Ticket Management System  
**Date:** Friday, 13 November 2026  
**Track:** Full-Stack TypeScript Engineering  
**Branch:** `feat/web-ticket-screens`  

---

## 1. Branch and PR link
- **Branch:** `feat/web-ticket-screens` (branched from `feat/web-login-foundation`)
- **PR Link:** Ready to open after pushing `git push -u origin feat/web-ticket-screens`

---

## 2. API contracts/schemas inspected
Inspected actual backend implementations in `apps/api/`:
- `GET /tickets`: Supports query parameters `page` (min 1), `limit` (1-100), `status` (`open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`), `priority` (`P1`, `P2`, `P3`, `P4`), `search` (max 100 chars, searches title, description, reference), `sortBy` (`createdAt`, `updatedAt`, `priority`, `status`, `title`), `sortOrder` (`asc`, `desc`). Returns `{ data: Ticket[], error: null, meta: { page, limit, total, totalPages } }`.
- `GET /tickets/:id`: Returns full ticket details. Scoped to customer ownership (customers receive 404 on other customers' tickets to prevent enumeration). Server strips `isInternal: true` comments for customer role.
- `PATCH /tickets/:id`: Updates `status`, `priority`, `category`, `assigneeId`. Automatically updates `resolvedAt` and `closedAt` on resolution/closure.
- `GET /tickets/:id/comments`: Returns array of comments sorted chronologically (`createdAt: asc`).
- `POST /tickets/:id/comments`: Accepts `{ body: string, isInternal?: boolean }`. Restricted: customers cannot create internal notes (403 Forbidden).
- `POST /tickets`: Validated by `createTicketSchema` (`title` min 3, max 255; `description` min 5; `priority` P1-P4; `category` max 100). Customer role forces `customerId = currentUser.id`.

---

## 3. Ticket list implementation
- Implemented `TicketsList` (`apps/web/src/features/tickets/components/TicketsList.tsx`) and `TicketsPage` (`apps/web/src/pages/TicketsPage.tsx`).
- Connected to `useTickets(queryParams)` hook.
- Synchronized with URL search parameters (`useSearchParams`) so pagination and filters are bookmarkable and survive page reloads.
- Responsive design: Desktop table with clickable rows + Mobile card list.
- Clickable ticket reference and row navigating to `/tickets/:id`.
- Action button linking to `/tickets/new`.

---

## 4. Pagination and filters tested
- Server-side pagination controls: Previous, Next, Page indicator (`Page X of Y`), and Total records counter (`Showing N of Total`).
- Disabled states verified: Previous disabled on page 1; Next disabled on the final page (`currentPage >= totalPages`).
- Filter controls:
  - Search input with submit button and live reset.
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

---

## 6. Ticket detail and comment thread
- Implemented `TicketDetailPage` (`apps/web/src/pages/TicketDetailPage.tsx`):
  - Displays ticket reference, status badge, priority badge, category, created date, customer information, and assigned agent.
  - Agent status transition: Agents and Admins see a "Change Status" dropdown (`open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`) that triggers the `useUpdateTicket` mutation.
  - Comment thread: Displays comments in chronological order (`createdAt: asc`).
  - Confidentiality: Comments with `isInternal: true` render a distinct amber `Internal Note` pill (visible only to agents/admins as backend strips them for customers).
  - Add comment form: Textarea with submit guard. For agents/admins, renders a checkbox for `Make internal note (visible only to support agents and admins)`.
  - Customers cannot see the internal note checkbox or the status transition dropdown.

---

## 7. Ticket creation form and shared Zod schema
- Implemented `CreateTicketPage` (`apps/web/src/pages/CreateTicketPage.tsx`):
  - Form state and validation managed via `react-hook-form` and `@hookform/resolvers/zod`.
  - Directly imported and reused `createTicketSchema` from `apps/api/src/validations/ticket.validation.ts` via `apps/web/src/features/tickets/schema/ticket-schema.ts`.
  - Zero duplicated Zod rules or drifting frontend definitions.
  - Fields: `title` (required, 3-255 chars), `priority` (`P1`–`P4`, default `P3`), `category` (optional), `description` (required, min 5 chars).
  - Displays inline field validation errors and top-level server error banner (`role="alert"`).
  - Disables submit button during submission (`Creating ticket...`) to prevent double-submits.
  - On success, invalidates ticket list cache and navigates to `/tickets/:id`.

---

## 8. TanStack Query keys/cache invalidation
Hierarchical query key factory in `apps/web/src/features/tickets/hooks/useTickets.ts`:
- `ticketKeys.all`: `['tickets']`
- `ticketKeys.lists()`: `['tickets', 'list']`
- `ticketKeys.list(params)`: `['tickets', 'list', params]`
- `ticketKeys.details()`: `['tickets', 'detail']`
- `ticketKeys.detail(id)`: `['tickets', 'detail', id]`
- `ticketKeys.comments(id)`: `['tickets', 'detail', id, 'comments']`
Cache Invalidation Rules:
- `useCreateTicket`: Invalidates `ticketKeys.lists()` and pre-seeds `ticketKeys.detail(newTicket.id)`.
- `useUpdateTicket`: Invalidates `ticketKeys.detail(id)` and `ticketKeys.lists()`.
- `useCreateComment`: Invalidates `ticketKeys.comments(ticketId)` and `ticketKeys.detail(ticketId)`.

---

## 9. Loading/empty/error states verified
Every screen includes dedicated loading, empty, and error states:
- **`TicketsList`**:
  - Loading: Animated spinner with `role="status"` and accessible label.
  - Error: Error card with `role="alert"`, error message, and `Retry` button.
  - Empty: Distinct states for empty workspace vs "No tickets match your filters" with a `Clear filters` button.
- **`TicketDetailPage`**:
  - Loading: Centered spinner for ticket and comments.
  - Error: 404 / network error card with `Retry` and `Back to Tickets` buttons.
  - Empty comments: Empty-state message prompting the first response.
- **`CreateTicketPage`**:
  - Submitting state: Button shows `Creating ticket...` and is disabled.
  - Error: `role="alert"` banner displaying API failure message.

---

## 10. Customer-to-agent workflow evidence
Verified the end-to-end customer-to-agent workflow contract:
1. **Customer submits ticket**: Customer visits `/tickets/new`, fills valid title (`>= 3` chars), priority, and description (`>= 5` chars). The form calls `POST /tickets`, receives `201 Created` with reference `TCK-2026-XXXX`, and navigates to the ticket detail page.
2. **Agent views queue**: Agent logs in, loads `/tickets`, and sees the newly created customer ticket in the server-backed queue with `open` and priority badges.
3. **Agent adds internal/public comment**: Agent opens `/tickets/:id`, enters comment, checks `Make internal note`, and posts comment (`POST /tickets/:id/comments`). The comment thread updates with the amber `Internal Note` pill.
4. **Agent updates status**: Agent selects `in_progress` in the status dropdown. `PATCH /tickets/:id` is executed; cache invalidation updates the status badge to `In Progress` in both detail and list views.
5. **Customer views ticket**: Customer reopens ticket; they see public comments and the updated `In Progress` badge, while internal notes remain strictly hidden by server scoping.

---

## 11. Tests run and actual output
- **TypeScript & Vite Production Build** (`npm --prefix apps/web run build` -> `tsc -b && vite build`):
  - Exited `0`: `✓ 198 modules transformed`, built `dist/index.html`, CSS (`27.64 kB`), and JS (`467.80 kB`).
- **Vitest Suite** (`npm --prefix apps/web test` -> `vitest run`):
  - **7 test files passed (7), 27 tests passed (27)**:
    - `src/lib/__tests__/api-client.test.ts` (3 tests passed)
    - `src/features/tickets/__tests__/tickets.api.test.ts` (5 tests passed)
    - `src/components/__tests__/ProtectedRoute.test.tsx` (2 tests passed)
    - `src/pages/__tests__/LoginPage.test.tsx` (3 tests passed)
    - `src/features/tickets/__tests__/TicketsList.test.tsx` (5 tests passed)
    - `src/pages/__tests__/TicketDetailPage.test.tsx` (6 tests passed)
    - `src/pages/__tests__/CreateTicketPage.test.tsx` (3 tests passed)

---

## 12. AI review findings and verified fixes
- **Shared Zod schema reuse path**: Configured `apps/web/src/features/tickets/schema/ticket-schema.ts` to import `createTicketSchema` directly from `../../../../../api/src/validations/ticket.validation.ts` via `@hookform/resolvers/zod`. Verified that zero schemas are duplicated.
- **RTL text matching in pagination test**: Resolved text-splitting assertion by using a custom text content matcher for `Page 2 of 3` across nested spans.
- **Unused import cleanup**: Removed unused imports (`beforeEach` in `tickets.api.test.ts` and `commentsError` in `TicketDetailPage.tsx`).
- **Re-verification**: Re-ran `npm --prefix apps/web run build` and `npm --prefix apps/web test`; both passed with 100% green exit code 0.

---

## 13. Prompt Journal updated
- Appended **Entry 20 — Day 14: Ticket Screens End to End (List, Detail with Comments, Create Form)** to `docs/prompt-journal.md`.

---

## 14. Blockers or API gaps
- None. Backend contracts in `apps/api` for ticket listing, pagination, filtering, single ticket fetching, status transitions, and public/internal comment threads are fully implemented and aligned.

---

## 15. What I learned
- Passing query parameters directly into the TanStack Query key factory (`ticketKeys.list(params)`) ensures that different filter combinations and pages are cached independently and never flicker stale results.
- Directly importing the backend's Zod schema in React Hook Form guarantees that client-side and server-side validation error messages and bounds remain 100% identical.

---

## 16. Term of the day — Acceptance criteria
**Acceptance criteria** are the specific, testable conditions a feature must satisfy to be accepted as complete. For Day 14, the central acceptance criterion is observable end-to-end behaviour: a customer creates a ticket, an agent sees it, the agent adds a comment, and the ticket status changes.
