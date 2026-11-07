# SupportDesk Prompt Journal

**Week:** 1
**Day:** 3 â€” LLMs & the 6-Box Prompt
**Date:** 23 October 2026
**Project:** SupportDesk â€” Customer Support Ticket Management System
**Source files reviewed:** `SupportDesk_Repository_README.md` and `SupportDesk_PRD_Redesigned_Compressed.docx`

> **Accuracy note:** The PRD and README both say that SupportDesk is still a proposal/draft awaiting senior review. The technology choices, MVP scope, priorities, workflow, and data model are not approved implementation requirements yet. This journal records the source-based analysis performed for this task and includes prompts that can be used or adapted. Before submitting it, make sure the â€œWhat I changedâ€ and â€œHow I checkedâ€ sections match the work you personally performed.

---

## Entry 1 â€” Understanding LLM concepts

- **Date:** 23 October 2026
- **Goal:** Understand tokens, context windows, hallucinations, and why confident answers can still be wrong.
- **Prompt used:** â€œExplain tokens, context windows, and hallucinations in beginner-friendly language. Give a simple example of each and explain how I should verify an AI-generated answer.â€
- **Summary of AI response:** A token is a unit of text processed by a language model; a context window limits how much conversation and source information can be considered at once; a hallucination is incorrect or unsupported content presented as if it were true. A fluent or confident answer is not proof of correctness.
- **What I changed or rejected:** No technical claim should be accepted only because it sounds confident. [Add any specific explanation you corrected or rejected, if applicable.]
- **Why I changed it:** Project decisions and requirements need support from the approved source material or another reliable check.
- **How I checked the result:** Reviewed the Day 3 assignmentâ€™s LLM glossary and verification checklist. [Add whether you also explained these concepts in your own words.]
- **What I learned:** AI output is a suggestion to evaluate, not an authority.
- **Follow-up question or unresolved assumption:** How can I provide the right project context without sharing confidential information?

## Entry 2 â€” Summarizing the SupportDesk PRD without inventing requirements

- **Date:** 23 October 2026
- **Goal:** Explain SupportDesk to a new intern using the supplied PRD and distinguish proposed requirements from approved decisions.
- **Prompt used:**
  â€œYou are helping a new intern understand SupportDesk. Summarize the supplied Product Requirements Document (PRD) using only information in that document. Organize the answer into product purpose, proposed users, proposed MVP scope, security expectations, and open questions. Clearly label proposals as unapproved, identify missing information, and do not invent requirements.â€
- **Summary of AI response:** The PRD describes a proposed web application for customers to submit and track support tickets, support agents to respond and manage assignment/priority/status, and administrators to manage access and review approved activity. Proposed MVP capabilities include authentication and role-based access, ticket creation and viewing, responses, assignment and priority, status/resolution, and limited administration/reporting if approved. The PRD says implementation should wait for senior approval.
- **What I changed or rejected:** I would reject any summary that presents proposed features, priorities, status transitions, success targets, or technology choices as already approved.
- **Why I changed it:** The PRDâ€™s status is â€œDraft â€” Submitted for senior review and approval,â€ and its approval status is â€œNot yet approved.â€
- **How I checked the result:** Cross-checked the summary against the PRDâ€™s Executive Summary, Stakeholders and User Roles, Scope and Boundaries, Functional Requirements, and Proposed Architecture and Technology sections.
- **What I learned:** Naming the source and asking the assistant to flag uncertainty helps prevent a draft proposal from being mistaken for a final specification.
- **Follow-up question or unresolved assumption:** Which scope, acceptance criteria, priorities, and technical choices will the project senior approve?

## Entry 3 â€” Improving the weak prompt â€œWrite code for ticket creationâ€

- **Date:** 23 October 2026
- **Goal:** Rewrite a vague coding request using the six-box structure without starting implementation before requirements are approved.
- **Prompt used (improved 6-box version):**

  **[1. CONTEXT]**
  Project: SupportDesk. The supplied PRD and repository README are drafts awaiting senior review. The PRD proposes React + Vite + Tailwind CSS for the frontend, Node.js + Express for the backend, and PostgreSQL for the database. Confirm the actual repository structure and approved stack before implementation.

  **[2. GOAL]**
  Help define the ticket-creation behavior described by proposed requirement FR-03 and user story US-01. The proposed behavior is to validate required fields, create a ticket, and show a unique reference after successful creation.

  **[3. CONSTRAINTS / GUARDRAILS]**
  Do not write production code yet. Use only source-supported requirements. Do not invent required fields, reference format, API response shapes, status values, or validation limits. Ask questions about gaps. Respect server-side validation and authorization expectations.

  **[4. EXAMPLES]**
  The PRDâ€™s US-01 says that a signed-in customer submitting valid required fields should receive a created ticket and its reference. Missing or invalid required fields should produce understandable validation feedback and must not create a ticket. This is a proposed acceptance criterion, not an approved commitment.

  **[5. OUTPUT FORMAT]**
  First list the source-supported requirements, then the unresolved questions, then a short implementation plan. Do not provide code until the senior-approved requirements and scope are confirmed.

  **[6. CHECKS]**
  Identify relevant positive, validation-failure, and authorization test cases. Separate suggested tests from tests actually run, and state what has not been verified.

- **Summary of AI response:** The improved prompt scopes the task to ticket creation and connects it to PRD items FR-03, FR-04, FR-15, and US-01. It also asks for clarification before coding.
- **What I changed or rejected:** The prompt avoids assuming exact ticket fields, reference-generation rules, endpoint contracts, and validation limits because the supplied documents do not fully define them.
- **Why I changed it:** Those details must be confirmed rather than guessed; the PRDâ€™s proposed API outline is illustrative only.
- **How I checked the result:** Compared the prompt with the six-box checklist and checked its ticket-creation statements against PRD sections 8 and 9, especially FR-03/FR-04/FR-15 and US-01.
- **What I learned:** A useful coding prompt sets boundaries and identifies missing requirements before asking for implementation.
- **Follow-up question or unresolved assumption:** What exact fields, field limits, unique-reference format, and API contract should be approved?

## Entry 4 â€” Critiquing the README and PRD for assumptions

- **Date:** 23 October 2026
- **Goal:** Check whether the project overview and proposed technical direction are stated consistently and safely.
- **Prompt used:**
  â€œCompare the supplied SupportDesk README and PRD. Report only claims supported by those files. Identify consistent details, unresolved decisions, and any wording that could make a proposal sound approved. Do not resolve open questions by guessing. Return a table with: topic, evidence in the documents, status, and action needed.â€
- **Summary of AI response:** Both documents describe SupportDesk as a proposed customer-support ticket-management system. Both propose a web stack of React/Vite/Tailwind CSS, Node.js/Express, and PostgreSQL. Both indicate that senior review is required before implementation. They identify candidate roles, ticket workflows, security expectations, and potential reports, while leaving decisions such as final status transitions, permissions, data rules, success targets, and approved scope unresolved.
- **What I changed or rejected:** I would reject any interpretation that the stack or MVP is final. I would also avoid treating README diagrams, data entities, example API routes, and candidate acceptance scenarios as proof that those features have been approved or implemented.
- **Why I changed it:** The README says its requirements, technology choices, diagrams, and folder structure are proposals until confirmed; the PRD is marked as a draft not yet approved.
- **How I checked the result:** Read the READMEâ€™s Project Overview, Proposed MVP Scope, Proposed Technology, Open Questions, and Project Status sections, and compared them with the PRDâ€™s document status, Scope and Boundaries, Proposed Architecture and Technology, and Open Questions.
- **What I learned:** Documentation can be internally useful while still containing proposals that require explicit approval.
- **Follow-up question or unresolved assumption:** Where will senior-approved decisions be recorded so the PRD, README, and implementation remain aligned?

## Entry 5 â€” Identifying assumptions and verification steps before implementation

- **Date:** 23 October 2026
- **Goal:** Separate documented expectations from assumptions and produce a verification plan.
- **Prompt used:**
  â€œUsing only the supplied SupportDesk PRD and README, make three lists: (1) source-supported proposed requirements, (2) unresolved questions/assumptions, and (3) verification steps. Include security and privacy checks, especially whether a customer can access another customerâ€™s ticket and whether protected actions are authorized on the server. Do not say a test passed unless test evidence is provided.â€
- **Summary of AI response:** Source-supported proposed expectations include server-side authorization, restricting customers to permitted tickets, input validation, clear error feedback, and agreed role-based access. Verification scenarios proposed by the PRD include checking that unauthorized ticket access is denied, valid ticket creation returns a reference, invalid required fields do not create a ticket, and critical ticket flows pass agreed tests. These are proposed checks; no test execution evidence was supplied by the documents.
- **What I changed or rejected:** I would reject statements such as â€œsecurity is implemented,â€ â€œall tests pass,â€ or â€œthe ticket workflow is approvedâ€ because the documents describe expectations and proposed tests rather than implementation results.
- **Why I changed it:** The README explicitly says that security considerations do not prove controls are implemented, and the PRD requires testing and acceptance against approved requirements.
- **How I checked the result:** Cross-checked the proposed checks against the PRDâ€™s Security and Privacy, Testing and Acceptance, and Risks and Mitigations sections, plus the READMEâ€™s Security and Privacy and Testing Strategy sections. No application tests were run as part of this document review.
- **What I learned:** A requirement, a suggested test, and evidence that a test passed are three different things.
- **Follow-up question or unresolved assumption:** Which acceptance criteria, security rules, test environment, and release checks will the senior approve?

---

## Day 3 self-review

- [x] LLM concepts reviewed.
- [x] Five weak prompts rewritten during the Day 3 exercise (as reported in my progress).
- [x] SupportDesk Project instructions saved (as reported in my progress).
- [x] Prompt Journal draft created with five entries.
- [ ] Review and personalize all entries so they accurately reflect the prompts, responses, edits, and checks actually completed.
- [ ] Save this file in the repository as `docs/prompt-journal.md`, if the repository is available.
- [ ] Confirm no secrets, credentials, `.env` values, customer data, or confidential company information are included.

**Reminder:** The supplied SupportDesk PRD and README remain drafts pending senior review. Do not treat proposed requirements, architecture, or tests as approved or implemented without evidence.

---

# Week 1 â€“ Day 4: Git, GitHub & Repository Structure

**Date:** 3 November 2026
**Project:** SupportDesk

## Entry 6 â€“ Inspecting an existing GitHub repository

- **Goal:** Understand the existing repository before making changes.
- **Prompt used:** "Guide me through the next step of Day 4. My SupportDesk repository already exists and I have GitHub access."
- **Summary of AI response:** The repository should be inspected before making changes. Git status, current branch, remote configuration and existing files should be checked.
- **What I changed or corrected:** Initially, I ran Git commands from an empty parent directory. After cloning the repository, I moved into the actual repository directory.
- **Why I changed it:** Git commands must be executed inside the repository or one of its subdirectories.
- **How I checked the result:** Used `git status`, `git branch --show-current`, `git remote -v`, `Get-ChildItem` and `git log`.
- **What I learned:** GitHub hosts repositories, while Git manages version history locally.
- **Follow-up question:** How can I inspect commit history to understand changes made by other contributors?

## Entry 7 â€“ Creating a feature branch and monorepo structure

- **Goal:** Create the initial SupportDesk monorepo without modifying the main branch.
- **Prompt used:** "Guide me step by step through creating the repository structure for the Day 4 assignment."
- **Summary of AI response:** Create a separate working branch, preserve existing documentation, create the required directories and use `.gitkeep` files to track empty directories.
- **What I changed or corrected:** Created the feature branch `samarth`, migrated `doc/` to `docs/`, and created the required application and supporting directories.
- **Why I changed it:** The repository needed to follow the Day 4 roadmap while preserving the existing PRD and Prompt Journal.
- **How I checked the result:** Used `git branch --show-current`, `git status --short`, `Get-ChildItem` and `tree /F`.
- **What I learned:** Feature branches isolate changes from the main branch. Git tracks files rather than empty directories.
- **Follow-up question:** How does Git detect file renames during a commit?

## Entry 8 â€“ Git configuration and environment-file protection

- **Goal:** Configure repository hygiene and prevent accidental commits of local environment files.
- **Prompt used:** "Help me configure `.gitignore` and `.env.example` for the SupportDesk monorepo without including real credentials."
- **Summary of AI response:** `.gitignore` excludes dependencies, build outputs, environment files, logs and local editor files. `.env.example` documents illustrative environment variables without real credentials.
- **What I changed or corrected:** Created the root `.gitignore` and `.env.example`. Removed trailing spaces from the database example.
- **Why I changed it:** Generated files and local credentials should not be committed. Example configuration should remain safe to share.
- **How I checked the result:** Used `Get-Content .gitignore`, `Get-Content .env.example`, `git check-ignore .env` and `git check-ignore .env.example`.
- **What I learned:** `.gitignore` protects matching untracked files from being added accidentally, but it does not automatically remove files that are already tracked.
- **Follow-up question:** How should environment variables be validated when the actual application configuration is implemented?

---

## Day 4 self-review

- [ ] Git and GitHub fundamentals understood.
- [ ] Repository structure reviewed.
- [ ] Feature branch and repository skeleton created.
- [ ] README reviewed and updated.
- [ ] Three Git-related Prompt Journal entries added.
- [ ] Git diff reviewed.
- [ ] First commit created.
- [ ] Feature branch pushed.
- [ ] First Pull Request opened.
- [ ] Lead-provided merge-conflict exercise completed or recorded as pending.
- [ ] EOD report prepared.

**Reminder:** The SupportDesk technology stack and architecture remain subject to project documentation and senior approval. Do not present proposed configuration as finalized.


---

# Week 2 â€“ Day 2 (Overall Day 8): Database Design with AI

**Date:** 5 November 2026
**Project:** SupportDesk â€” Customer Support Ticket Management System
**Source files reviewed:** `SupportDesk_PRD_Redesigned_Compressed.docx`, `SupportDesk_Repository_README.md`, and Day 8 Assignment Instructions.

---

## Entry 9 â€“ Entity and Relationship Analysis with AI

- **Date:** 5 November 2026
- **Goal:** Transform ambiguous product requirements into a formal relational model with clearly defined entities, attributes, primary/foreign keys, and cardinalities without inventing unapproved requirements.
- **Prompt used (6-box format):**
  - **[1. CONTEXT]:** Project: SupportDesk. The PRD is an unapproved draft proposing a customer support ticketing system with tickets, comments, categories/tags, and user roles (Customer, Agent, Admin). The Day 8 curriculum requires PostgreSQL and Prisma ORM.
  - **[2. GOAL]:** Identify core entities, attributes, primary keys, foreign keys, and cardinalities needed for MVP ticket management.
  - **[3. CONSTRAINTS]:** Do not invent unapproved fields (e.g. SLA dates, complex org hierarchies). Distinguish explicit PRD items from Day 8 curriculum additions. Clearly label unconfirmed assumptions as PENDING MENTOR APPROVAL.
  - **[4. EXAMPLES]:** A customer creates many tickets; an agent is assigned many tickets; a ticket has many comments and tags.
  - **[5. OUTPUT FORMAT]:** Markdown table listing Entity, Attributes, PK/FK, Relationships, Cardinality, and Source Authority (PRD vs Day 8 vs README).
  - **[6. CHECKS]:** Verify relational integrity, ensure many-to-many relationships (tickets-tags) have explicit junction mechanisms, and verify referential cascade actions.
- **Summary of AI response:** Proposed 7 entities: `User`, `Ticket`, `Comment`, `Tag`, `TicketTag` (junction), `Attachment`, and `AuditLog`. Specified 1:N relations between User and Ticket (both as customer and assigned agent), Ticket and Comment, and N:M between Ticket and Tag.
- **What I changed or rejected:** Rejected an initial AI proposal for string-based role and status columns; replaced them with PostgreSQL ENUMs (`Role`, `TicketStatus`, `TicketPriority`) to enforce schema-level data integrity. Flagged `assignedAgentId` as nullable because unassigned tickets are a standard triage workflow state. Explicitly rejected unapproved SLA deadline fields as pending mentor approval.
- **Why I changed it:** Enums prevent silent data corruption (e.g. typos in statuses). Required agent assignment at ticket creation would break customer self-service ticket logging.
- **How I checked the result:** Cross-referenced entity definitions against PRD Section 8 (Functional Requirements) and Section 9 (User Stories), recording traceability in `docs/database-design-notes.md`.
- **What I learned:** AI tends to hallucinate enterprise features (complex SLAs, team hierarchies) unless strictly constrained to the documented MVP boundaries.
- **Follow-up question or unresolved assumption:** Will future requirements require soft deletes (`deletedAt`) across all entities, or is hard delete with cascade acceptable for MVP?

---

## Entry 10 â€“ AI-Assisted Schema Review and Constraint Justification

- **Date:** 5 November 2026
- **Goal:** Review proposed Prisma schema with an AI database architect to evaluate delete cascades, referential integrity constraints, and nullability.
- **Prompt used (6-box format):**
  - **[1. CONTEXT]:** Relational schema for SupportDesk running PostgreSQL 16 via Prisma ORM 5.22.0.
  - **[2. GOAL]:** Critique proposed onDelete actions for all foreign keys (User -> Ticket, Ticket -> Comment, Ticket -> Attachment, Ticket -> TicketTag).
  - **[3. CONSTRAINTS]:** Protect operational auditability. Do not permit cascading deletions that obliterate business records if a user is deleted.
  - **[4. EXAMPLES]:** If a ticket is deleted, comments should cascade delete. If a user is deleted, tickets and comments must not silently vanish.
  - **[5. OUTPUT FORMAT]:** Table of Foreign Key, Proposed Cascade, Risk Assessment, and Final Architecture Decision.
  - **[6. CHECKS]:** Ensure no orphaned rows and no accidental loss of customer support history.
- **Summary of AI response:** Recommended `Cascade` for `Ticket -> Comment`, `Ticket -> Attachment`, and `TicketTag`. Recommended `Restrict` on `User -> Ticket (customer)` and `User -> Comment (author)` to prevent accidental deletion of historical conversations. Recommended `SetNull` on `User -> Ticket (assignedAgentId)`.
- **What I changed or rejected:** Accepted all proposed cascade safeguards. Explicitly rejected AI proposal to use `SetNull` for `Ticket.customerId` because anonymous tickets violate SupportDesk audit rules.
- **Why I changed it:** In customer support systems, a ticket must always be attributed to an authentic customer account for communication and verification.
- **How I checked the result:** Generated the initial Prisma migration (`20261106063825_init_supportdesk_database`) and inspected the resulting SQL DDL constraints using `psql \d tickets` and `\d comments`.
- **What I learned:** Defaulting to `Cascade` everywhere is dangerous; referential integrity requires nuanced trade-offs between automated cleanup and historical audit retention.
- **Follow-up question or unresolved assumption:** When users request GDPR/privacy account deletion, how should customer tickets be anonymized without violating referential constraints?

---

## Entry 11 â€“ Index Selection and Query Performance Analysis with AI

- **Date:** 5 November 2026
- **Goal:** Analyze expected SupportDesk query access patterns to determine optimal database indexes while avoiding excessive index overhead.
- **Prompt used (6-box format):**
  - **[1. CONTEXT]:** SupportDesk database with 7 tables. Expected initial workload: read-heavy ticket dashboard filtering by customer, agent, status, and priority, plus chronological comment thread rendering.
  - **[2. GOAL]:** Propose targeted B-tree indexes for `tickets`, `comments`, and `audit_logs`, providing specific SQL query justifications.
  - **[3. CONSTRAINTS]:** Every proposed index must correspond to a concrete user story or query pattern. Avoid unnecessary single-column indexes on low-cardinality fields without composite context.
  - **[4. EXAMPLES]:** Customer viewing "My Tickets" sorted by date; Agent viewing "Open High-Priority Tickets".
  - **[5. OUTPUT FORMAT]:** Index definition, target columns, query pattern justified, and write-overhead trade-off analysis.
  - **[6. CHECKS]:** Validate that foreign keys used in joins have supporting indexes to prevent sequential scans.
- **Summary of AI response:** Recommended 8 indexes: `tickets(customer_id)`, `tickets(assigned_agent_id)`, `tickets(status)`, `tickets(priority)`, `tickets(created_at)`, composite `tickets(status, priority)`, composite `comments(ticket_id, created_at)`, and composite `audit_logs(entity_type, entity_id)`.
- **What I changed or rejected:** Accepted all 8 indexes. Proactively validated that `comments(ticket_id, created_at)` satisfies both the foreign key join lookup and the chronological thread display in a single index scan.
- **Why I changed it:** Without `(ticket_id, created_at)`, fetching comments for a ticket requires an index scan on `ticket_id` followed by an in-memory sort on `created_at`.
- **How I checked the result:** Verified generated SQL in migration directory confirming `CREATE INDEX` statements exist for all 8 indexes. Verified with `\d tickets` in `psql`.
- **What I learned:** Indexes speed up reads but add measurable write overhead on inserts and updates; each index must earn its place based on documented query patterns.
- **Follow-up question or unresolved assumption:** At what ticket volume (e.g. 100k+ rows) will full-text search on `title` and `description` require PostgreSQL `tsvector` / GIN indexing instead of B-tree?

---

## Day 8 self-review

- [x] Relational database fundamentals and terminology understood.
- [x] PRD and Day 8 requirements analyzed for entities and relationships.
- [x] Proposed database design notes documented in `docs/database-design-notes.md`.
- [x] 6-box AI prompt journal updated with Entries 9, 10, and 11.
- [x] Valid Prisma schema created in `apps/api/prisma/schema.prisma`.
- [x] Docker Compose configured for local PostgreSQL (non-colliding port 5433).
- [x] First migration generated and applied cleanly (`init_supportdesk_database`).
- [x] CSV-to-JSON standalone conversion tool created and executed.
- [x] Database seeded with foundational users, tags, and exactly 50 sample tickets.
- [x] Visual Mermaid ER diagram created in `docs/supportdesk-erd.md`.
- [x] Feature branch created and changes committed with clean Git history.
- [x] Final EOD Report prepared in `docs/day-8/SupportDesk_Day8_EOD_Report.md`.

---

# Week 2 – Day 3 (Overall Day 9): API Skeleton and MVC in Practice

**Date:** 7 November 2026
**Project:** SupportDesk — Customer Support Ticket Management System
**Theme:** Build and verify a production-ready Express/TypeScript REST API utilizing the four-layer architecture (Routes → Controllers → Services → Repositories → Prisma).

---

## Entry 12 – Four-Layer MVC Architecture and Prisma Isolation

- **Date:** 7 November 2026
- **Goal:** Design and enforce a strict four-layer separation of concerns where Prisma database queries are isolated exclusively inside repository classes.
- **Prompt used (6-box format):**
  - **[1. CONTEXT]:** SupportDesk Express + TypeScript backend API using Prisma ORM with PostgreSQL.
  - **[2. GOAL]:** Propose a layered folder and file architecture for Ticket CRUD operations: `Routes -> Controllers -> Services -> Repositories -> Prisma`.
  - **[3. CONSTRAINTS]:** Zero Prisma imports outside `repositories/`. Controllers must not perform database queries. Services must not depend on Express `req` or `res`. Routes must contain only route definitions, middlewares, and controller bindings.
  - **[4. EXAMPLES]:** Route receives `GET /tickets/:id` -> Controller extracts numerical `id` -> Service validates ticket existence and business logic -> Repository runs `prisma.ticket.findFirst` -> returns entity back up the chain.
  - **[5. OUTPUT FORMAT]:** Architectural responsibility matrix and TypeScript type definitions for the DTO and Repository layers.
  - **[6. CHECKS]:** Run static analysis/grep to verify that `@prisma/client` is imported only inside `repositories/`.
- **Summary of AI response:** Outlined the 4-layer structure. Highlighted that Prisma types (`TicketStatus`, `TicketPriority`, `Ticket`) should be re-exported by `ticket.repository.ts` so controllers and services remain decoupled from the Prisma client package.
- **What I changed or rejected:** Accepted the layer boundaries. Proactively rejected having controllers import Prisma enums directly; instead, re-exported all needed domain types from `ticket.repository.ts`.
- **Why I changed it:** Prevents architectural leakage and ensures that an audit grep for `@prisma/client` strictly matches only files in `apps/api/src/repositories/`.
- **How I checked the result:** Executed PowerShell script scanning all files in `apps/api/src` for `@prisma/client`. Only `prisma.client.ts` and `ticket.repository.ts` contained matches.
- **What I learned:** Clean layered boundaries make controllers trivial to unit test with mocks because services have no HTTP coupling.
- **Follow-up question or unresolved assumption:** How will future authentication context (e.g. current user role) be passed to services without coupling them to Express request objects?

---

## Entry 13 – Standard Response Envelope and Central Error Handling

- **Date:** 7 November 2026
- **Goal:** Implement an unvarying standard response envelope `{ data, error, meta }` and central error middleware handling 400, 404, and safe 500 responses without leaking secrets or stack traces.
- **Prompt used (6-box format):**
  - **[1. CONTEXT]:** SupportDesk REST API with Express 5 and TypeScript strict mode.
  - **[2. GOAL]:** Build a central Express error handler and uniform response wrapper for both success and error payloads.
  - **[3. CONSTRAINTS]:** Every endpoint must return `{ data, error, meta }`. Stack traces, raw SQL queries, and Prisma error codes must never be leaked to the client. Malformed JSON must produce a clean 400 response.
  - **[4. EXAMPLES]:** Success: `{ "data": { ... }, "error": null, "meta": {} }`. Error: `{ "data": null, "error": { "code": "NOT_FOUND", "message": "Ticket with ID 999 not found" }, "meta": {} }`.
  - **[5. OUTPUT FORMAT]:** `errorHandler` middleware and `AppError` class hierarchy.
  - **[6. CHECKS]:** Test with valid requests, 400 invalid inputs, 404 non-existent IDs, and a deliberate 500 endpoint (`GET /test/error`).
- **Summary of AI response:** Provided `AppError` hierarchy (`NotFoundError`, `BadRequestError`, `ValidationError`), response utilities, and an Express error-handling middleware that catches `ZodError` and generic `Error`.
- **What I changed or rejected:** Added specific handling for Express `SyntaxError` (when clients send invalid JSON in request bodies) to return HTTP 400 with `INVALID_JSON` rather than an unhandled 500 error.
- **Why I changed it:** Malformed client JSON is a client-side error (400), not an internal server malfunction (500).
- **How I checked the result:** Tested `GET /test/error` (returned safe 500 with sanitized message) and tested malformed JSON payload (returned 400).
- **What I learned:** Centralized error handling guarantees security compliance because no raw database exceptions or internal stack traces reach API clients.
- **Follow-up question or unresolved assumption:** Should client-side error codes be cataloged in an API contract document for frontend integration?

---

## Entry 14 – Defensive Zod Validation and Express 5 Compatibility

- **Date:** 7 November 2026
- **Goal:** Implement robust schema validation for environment variables and request bodies, parameters, and query strings using Zod in TypeScript strict mode.
- **Prompt used (6-box format):**
  - **[1. CONTEXT]:** Express 5 application with TypeScript 5.6 strict mode and Zod.
  - **[2. GOAL]:** Create reusable middleware for validating `req.body`, `req.params`, and `req.query`.
  - **[3. CONSTRAINTS]:** Express 5 makes `req.query` a read-only getter on `IncomingMessage`. Validation middlewares must validate without attempting illegal reassignments that trigger runtime TypeError.
  - **[4. EXAMPLES]:** `validateParams(ticketIdParamSchema)` ensures `:id` is a positive integer string. `validateBody(createTicketSchema)` requires `title`, `description`, `customerId`.
  - **[5. OUTPUT FORMAT]:** Middleware functions `validateBody`, `validateParams`, `validateQuery` and Zod schemas.
  - **[6. CHECKS]:** Verify compilation with `npx tsc --noEmit` and integration tests against all endpoints.
- **Summary of AI response:** Designed Zod schemas and validation middlewares. Noted that Express 5 requires parsing without direct reassignment of getter properties on `IncomingMessage`.
- **What I changed or rejected:** Refactored `validateParams` and `validateQuery` to execute `schema.parse()` without reassigning getter properties. Added a safe `parseId` helper in `ticket.controller.ts` to handle Express 5's `string | string[]` param types under strict mode.
- **Why I changed it:** In Express 5, `req.params` and `req.query` types differ from Express 4; directly assigning to `req.query` throws `TypeError: Cannot set property query of #<IncomingMessage> which has only a getter`.
- **How I checked the result:** Ran all 11 automated integration tests in `test-api.ts`. All 11 passed with 100% success rate.
- **What I learned:** Framework major version changes (Express 4 to 5) alter internal property descriptors; validation layers must be written defensively against getter-only properties.
- **Follow-up question or unresolved assumption:** How should pagination query parameters (`page`, `limit`) be standardized across all future endpoints?

---

## Day 9 self-review

- [x] Express + TypeScript API initialized with TypeScript strict mode.
- [x] Zod environment validation configured (`PORT`, `NODE_ENV`, `DATABASE_URL`).
- [x] Request logging middleware implemented with sensitive parameter masking.
- [x] Central error handler implemented (400, 404, safe 500).
- [x] `GET /health` endpoint implemented and verified.
- [x] Ticket CRUD endpoints implemented (`GET /tickets`, `GET /tickets/:id`, `POST /tickets`, `PATCH /tickets/:id`, `DELETE /tickets/:id`).
- [x] Four-layer architecture verified (Routes → Controllers → Services → Repositories → Prisma).
- [x] Zero Prisma imports verified outside `repositories/`.
- [x] Standard response envelope `{ data, error, meta }` verified on all endpoints.
- [x] Postman collection created at `postman/SupportDesk_Day9_API_Skeleton.postman_collection.json`.
- [x] Integration test suite executed (11 / 11 tests passing).
- [x] Clean Git branch `feature/day-9-api-mvc` and conventional commit created.
- [x] Comprehensive Day 9 EOD report prepared in `docs/day-9/SupportDesk_Day9_EOD_Report.md`.
