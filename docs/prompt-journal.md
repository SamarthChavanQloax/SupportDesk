# SupportDesk Prompt Journal

**Project:** SupportDesk — Customer Support Ticket Management System  
**Track:** Full-Stack TypeScript Engineering  

---

## Entry 1 — Understanding LLM concepts
- **Date:** 23 October 2026
- **Goal:** Understand tokens, context windows, hallucinations, and why confident answers can still be wrong.
- **Prompt used:** “Explain tokens, context windows, and hallucinations in beginner-friendly language. Give a simple example of each and explain how I should verify an AI-generated answer.”
- **Summary of AI response:** A token is a unit of text processed by a language model; a context window limits how much conversation and source information can be considered at once; a hallucination is incorrect or unsupported content presented as if it were true. A fluent or confident answer is not proof of correctness.
- **What I changed or rejected:** No technical claim should be accepted only because it sounds confident.
- **Why I changed it:** Project decisions and requirements need support from the approved source material or another reliable check.
- **How I checked the result:** Reviewed the Day 3 assignment’s LLM glossary and verification checklist.
- **What I learned:** AI output is a suggestion to evaluate, not an authority.
- **Follow-up question or unresolved assumption:** How can I provide the right project context without sharing confidential information?

## Entry 2 — Summarizing the SupportDesk PRD without inventing requirements
- **Date:** 23 October 2026
- **Goal:** Explain SupportDesk to a new intern using the supplied PRD and distinguish proposed requirements from approved decisions.
- **Prompt used:** “You are helping a new intern understand SupportDesk. Summarize the supplied Product Requirements Document (PRD) using only information in that document. Organize the answer into product purpose, proposed users, proposed MVP scope, security expectations, and open questions. Clearly label proposals as unapproved, identify missing information, and do not invent requirements.”
- **Summary of AI response:** The PRD describes a proposed web application for customers to submit and track support tickets, support agents to respond and manage assignment/priority/status, and administrators to manage access and review approved activity.
- **What I changed or rejected:** I would reject any summary that presents proposed features, priorities, status transitions, success targets, or technology choices as already approved.
- **Why I changed it:** The PRD’s status is “Draft — Submitted for senior review and approval,” and its approval status is “Not yet approved.”
- **How I checked the result:** Cross-checked the summary against the PRD’s Executive Summary, Stakeholders and User Roles, Scope and Boundaries, Functional Requirements, and Proposed Architecture and Technology sections.
- **What I learned:** Naming the source and asking the assistant to flag uncertainty helps prevent a draft proposal from being mistaken for a final specification.

---

## Entry 17 — Day 11: Test-First Planning for Query Parameter Validation and Comment Visibility
- **Date:** 10 November 2026
- **Goal:** Apply the test-first workflow to two core business functions before writing production logic: (1) Ticket Query parameter validation & sanitization (`validateAndSanitizeTicketQuery`), and (2) Role-based Comment visibility filtering (`filterCommentsForRole`).
- **Prompt used:**
  > "Act as a senior TypeScript test engineer. Before implementing Day 11 querying and comments, write isolated test suites for two pure functions:
  > 1. `validateAndSanitizeTicketQuery`: takes raw query object and validates pagination defaults (page 1, limit 10, max 100), sort allowlists (createdAt, updatedAt, priority, status, title), sort orders (asc, desc), status and priority enums, and search string trimming.
  > 2. `filterCommentsForRole`: takes an array of Comment entities and a user role ('customer', 'agent', 'admin'). If role is customer, strictly excludes internal comments (`isInternal === true`); if agent or admin, includes all comments.
  > Write the failing tests first according to Jest conventions."
- **Summary of AI response:** Generated comprehensive test suites covering valid cases, negative/out-of-bounds parameters, SQL-injection style malicious sort fields, and role boundaries for comments.
- **What I changed or rejected:** Rejected suggestions to put Prisma database calls inside the query validator or comment filter. Kept these functions pure and decoupled from ORM infrastructure to enable instant unit test execution with zero database dependencies.
- **Why I changed it:** Follows the Single Responsibility Principle (SRP) and ensures business logic and security policies can be verified deterministically in isolation.
- **How I checked the result:** Ran `npx jest src/utils/__tests__` and verified that both test suites passed 11/11 tests.
- **What I learned:** Writing unit tests before implementation forces clear API boundaries and exposes edge cases (such as Zod string coercion vs numeric pipeline types) early.

---

## Entry 18 — Day 11: OpenAPI 3.0 Documentation & Swagger UI Interactive Integration
- **Date:** 10 November 2026
- **Goal:** Create an accurate OpenAPI 3.0 specification for all implemented SupportDesk API endpoints and serve an interactive documentation UI at `/docs`.
- **Prompt used:**
  > "Act as an API architect. Review all actual routes in the SupportDesk Express API (`/health`, `/auth/register`, `/auth/login`, `/tickets`, `/tickets/:id`, `/tickets/:id/comments`). Produce an OpenAPI 3.0.3 specification that documents:
  > 1. Bearer JWT security scheme.
  > 2. Query parameters for ticket pagination, filtering, search, and sorting.
  > 3. Standard response envelope `{ data, error, meta }`.
  > 4. Error response codes (400, 401, 403, 404, 409).
  > Do not invent endpoints or fields that do not exist in the code. Mount Swagger UI at `/docs`."
- **Summary of AI response:** Produced `openapi.json` and mounted `swaggerUi.serve` and `swaggerUi.setup` in `app.ts`. Also exposed `/docs.json` for raw schema consumption.
- **What I changed or rejected:** Rejected adding unapproved endpoints (e.g. `/users`, `/analytics`, `/export`) that were not part of the approved MVP. Ensured `isInternal` on comments is clearly documented with access restriction notes (customers cannot create or view internal comments).
- **Why I changed it:** The OpenAPI documentation must reflect the exact reality of the implemented API without phantom endpoints or imaginary data models.
- **How I checked the result:** Verified with Supertest integration tests in `src/__tests__/integration.test.ts` that `GET /docs/` returns HTTP 200 with Swagger UI assets, and `GET /docs.json` returns HTTP 200 with valid OpenAPI 3.0 JSON.
- **What I learned:** Maintaining documentation as code alongside automated tests guarantees that documentation never drifts from production behavior.
