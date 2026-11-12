# SupportDesk — Day 13 EOD Report

**Date:** 12 November 2026  
**Branch:** `feat/web-login-foundation` (branched from `samarth`)  
**Workspace:** `apps/web` (`@supportdesk/web`)

---

## 1. Summary of Day 13 Deliverables
- Completed **Google Stitch** desktop + mobile (390px) UI prototypes and organized overview notes for leader review (`https://stitch.google.com/projects/5142013918804021795?pli=1`).
- Scaffolded the **`apps/web`** frontend application using React 19, Vite 7, TypeScript, Tailwind CSS v4, React Router v7, TanStack Query v5, React Hook Form v7, and Vitest v4 + React Testing Library.
- Implemented a shared typed API client (`src/lib/api-client.ts`), Bearer JWT auth context (`src/lib/auth.tsx`), route guards (`src/components/ProtectedRoute.tsx`), responsive Navy + Teal shell (`src/components/AppLayout.tsx`), accessible `LoginPage`, and `TicketsOverview` backed by `useTickets()`.

## 2. Folder & File Structure Created (`apps/web`)
- `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/index.html`
- `apps/web/.env.example` (committed with `VITE_API_BASE_URL=http://localhost:3000`; `.env` remains gitignored)
- `apps/web/src/index.css` — Central CSS variables + Tailwind `@theme` Navy (`#172B4D`), Blue (`#2563EB`), Teal (`#0D9488`), and ticket status tokens
- `apps/web/src/test-setup.ts` — Vitest DOM matchers (`@testing-library/jest-dom/vitest`)
- `apps/web/src/lib/api-client.ts` — `apiClient`, `ApiError`, `configureApiAuth`, reading `import.meta.env.VITE_API_BASE_URL`
- `apps/web/src/lib/auth.tsx` — `AuthProvider`, `useAuth`, `localStorage` session persistence (`supportdesk_auth_session`), `POST /auth/login`, `401` auto-clear
- `apps/web/src/features/tickets/api/tickets.api.ts` — `fetchTickets`
- `apps/web/src/features/tickets/hooks/useTickets.ts` — `useTickets` TanStack Query hook
- `apps/web/src/features/tickets/components/TicketsOverview.tsx` — loading, error+retry, empty, desktop table, and mobile card views
- `apps/web/src/components/ProtectedRoute.tsx` — `ProtectedRoute` and `PublicOnlyRoute`
- `apps/web/src/components/AppLayout.tsx` — desktop sidebar + mobile hamburger slide-over drawer + user role badge & sign-out header
- `apps/web/src/pages/LoginPage.tsx` — React Hook Form validation, loading state, `role="alert"` error banner
- `apps/web/src/pages/TicketsPage.tsx` — authenticated `/tickets` landing page
- `apps/web/src/App.tsx`, `apps/web/src/main.tsx`

## 3. Verification Results
- **TypeScript & Production Build** (`npm --prefix apps/web run build` -> `tsc -b && vite build`):
  - Exited `0`, transformed 96 modules (`dist/index.html`, CSS, and JS bundle built cleanly).
- **Automated Tests** (`npm --prefix apps/web test` -> `vitest run`):
  - **3 test files passed (3), 8 tests passed (8)**:
    - `src/lib/__tests__/api-client.test.ts` (3 tests): `VITE_API_BASE_URL` + Bearer header injection, `401` error envelope mapping & unauthorized callback, network rejection `NETWORK_ERROR`.
    - `src/components/__tests__/ProtectedRoute.test.tsx` (2 tests): unauthenticated `/tickets` -> `/login` redirect, authenticated `/login` -> `/tickets` redirect.
    - `src/pages/__tests__/LoginPage.test.tsx` (3 tests): empty/malformed email validation, loading state + `/tickets` navigation on success, `role="alert"` on invalid credentials.
- **Architecture Audit**:
  - Confirmed `fetch(` is isolated to `src/lib/api-client.ts` only, with zero hardcoded `http://localhost` URLs in `apps/web/src`.
- **Documentation**:
  - Appended Entry 19 to `docs/prompt-journal.md`.

## 4. Notes & Next Steps
- Live end-to-end browser testing of `/login` against a running `apps/api` + PostgreSQL instance is ready via `VITE_API_BASE_URL=http://localhost:3000`.
- Ready for review and push on branch `feat/web-login-foundation`.
