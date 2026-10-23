# SupportDesk Prompt Journal

**Week:** 1  
**Day:** 3 — LLMs & the 6-Box Prompt  
**Date:** 23 October 2026  
**Project:** SupportDesk — Customer Support Ticket Management System  
**Source files reviewed:** `SupportDesk_Repository_README.md` and `SupportDesk_PRD_Redesigned_Compressed.docx`

> **Accuracy note:** The PRD and README both say that SupportDesk is still a proposal/draft awaiting senior review. The technology choices, MVP scope, priorities, workflow, and data model are not approved implementation requirements yet. This journal records the source-based analysis performed for this task and includes prompts that can be used or adapted. Before submitting it, make sure the “What I changed” and “How I checked” sections match the work you personally performed.

---

## Entry 1 — Understanding LLM concepts

- **Date:** 23 October 2026
- **Goal:** Understand tokens, context windows, hallucinations, and why confident answers can still be wrong.
- **Prompt used:** “Explain tokens, context windows, and hallucinations in beginner-friendly language. Give a simple example of each and explain how I should verify an AI-generated answer.”
- **Summary of AI response:** A token is a unit of text processed by a language model; a context window limits how much conversation and source information can be considered at once; a hallucination is incorrect or unsupported content presented as if it were true. A fluent or confident answer is not proof of correctness.
- **What I changed or rejected:** No technical claim should be accepted only because it sounds confident. [Add any specific explanation you corrected or rejected, if applicable.]
- **Why I changed it:** Project decisions and requirements need support from the approved source material or another reliable check.
- **How I checked the result:** Reviewed the Day 3 assignment’s LLM glossary and verification checklist. [Add whether you also explained these concepts in your own words.]
- **What I learned:** AI output is a suggestion to evaluate, not an authority.
- **Follow-up question or unresolved assumption:** How can I provide the right project context without sharing confidential information?

## Entry 2 — Summarizing the SupportDesk PRD without inventing requirements

- **Date:** 23 October 2026
- **Goal:** Explain SupportDesk to a new intern using the supplied PRD and distinguish proposed requirements from approved decisions.
- **Prompt used:**  
  “You are helping a new intern understand SupportDesk. Summarize the supplied Product Requirements Document (PRD) using only information in that document. Organize the answer into product purpose, proposed users, proposed MVP scope, security expectations, and open questions. Clearly label proposals as unapproved, identify missing information, and do not invent requirements.”
- **Summary of AI response:** The PRD describes a proposed web application for customers to submit and track support tickets, support agents to respond and manage assignment/priority/status, and administrators to manage access and review approved activity. Proposed MVP capabilities include authentication and role-based access, ticket creation and viewing, responses, assignment and priority, status/resolution, and limited administration/reporting if approved. The PRD says implementation should wait for senior approval.
- **What I changed or rejected:** I would reject any summary that presents proposed features, priorities, status transitions, success targets, or technology choices as already approved.
- **Why I changed it:** The PRD’s status is “Draft — Submitted for senior review and approval,” and its approval status is “Not yet approved.”
- **How I checked the result:** Cross-checked the summary against the PRD’s Executive Summary, Stakeholders and User Roles, Scope and Boundaries, Functional Requirements, and Proposed Architecture and Technology sections.
- **What I learned:** Naming the source and asking the assistant to flag uncertainty helps prevent a draft proposal from being mistaken for a final specification.
- **Follow-up question or unresolved assumption:** Which scope, acceptance criteria, priorities, and technical choices will the project senior approve?

## Entry 3 — Improving the weak prompt “Write code for ticket creation”

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
  The PRD’s US-01 says that a signed-in customer submitting valid required fields should receive a created ticket and its reference. Missing or invalid required fields should produce understandable validation feedback and must not create a ticket. This is a proposed acceptance criterion, not an approved commitment.

  **[5. OUTPUT FORMAT]**  
  First list the source-supported requirements, then the unresolved questions, then a short implementation plan. Do not provide code until the senior-approved requirements and scope are confirmed.

  **[6. CHECKS]**  
  Identify relevant positive, validation-failure, and authorization test cases. Separate suggested tests from tests actually run, and state what has not been verified.

- **Summary of AI response:** The improved prompt scopes the task to ticket creation and connects it to PRD items FR-03, FR-04, FR-15, and US-01. It also asks for clarification before coding.
- **What I changed or rejected:** The prompt avoids assuming exact ticket fields, reference-generation rules, endpoint contracts, and validation limits because the supplied documents do not fully define them.
- **Why I changed it:** Those details must be confirmed rather than guessed; the PRD’s proposed API outline is illustrative only.
- **How I checked the result:** Compared the prompt with the six-box checklist and checked its ticket-creation statements against PRD sections 8 and 9, especially FR-03/FR-04/FR-15 and US-01.
- **What I learned:** A useful coding prompt sets boundaries and identifies missing requirements before asking for implementation.
- **Follow-up question or unresolved assumption:** What exact fields, field limits, unique-reference format, and API contract should be approved?

## Entry 4 — Critiquing the README and PRD for assumptions

- **Date:** 23 October 2026
- **Goal:** Check whether the project overview and proposed technical direction are stated consistently and safely.
- **Prompt used:**  
  “Compare the supplied SupportDesk README and PRD. Report only claims supported by those files. Identify consistent details, unresolved decisions, and any wording that could make a proposal sound approved. Do not resolve open questions by guessing. Return a table with: topic, evidence in the documents, status, and action needed.”
- **Summary of AI response:** Both documents describe SupportDesk as a proposed customer-support ticket-management system. Both propose a web stack of React/Vite/Tailwind CSS, Node.js/Express, and PostgreSQL. Both indicate that senior review is required before implementation. They identify candidate roles, ticket workflows, security expectations, and potential reports, while leaving decisions such as final status transitions, permissions, data rules, success targets, and approved scope unresolved.
- **What I changed or rejected:** I would reject any interpretation that the stack or MVP is final. I would also avoid treating README diagrams, data entities, example API routes, and candidate acceptance scenarios as proof that those features have been approved or implemented.
- **Why I changed it:** The README says its requirements, technology choices, diagrams, and folder structure are proposals until confirmed; the PRD is marked as a draft not yet approved.
- **How I checked the result:** Read the README’s Project Overview, Proposed MVP Scope, Proposed Technology, Open Questions, and Project Status sections, and compared them with the PRD’s document status, Scope and Boundaries, Proposed Architecture and Technology, and Open Questions.
- **What I learned:** Documentation can be internally useful while still containing proposals that require explicit approval.
- **Follow-up question or unresolved assumption:** Where will senior-approved decisions be recorded so the PRD, README, and implementation remain aligned?

## Entry 5 — Identifying assumptions and verification steps before implementation

- **Date:** 23 October 2026
- **Goal:** Separate documented expectations from assumptions and produce a verification plan.
- **Prompt used:**  
  “Using only the supplied SupportDesk PRD and README, make three lists: (1) source-supported proposed requirements, (2) unresolved questions/assumptions, and (3) verification steps. Include security and privacy checks, especially whether a customer can access another customer’s ticket and whether protected actions are authorized on the server. Do not say a test passed unless test evidence is provided.”
- **Summary of AI response:** Source-supported proposed expectations include server-side authorization, restricting customers to permitted tickets, input validation, clear error feedback, and agreed role-based access. Verification scenarios proposed by the PRD include checking that unauthorized ticket access is denied, valid ticket creation returns a reference, invalid required fields do not create a ticket, and critical ticket flows pass agreed tests. These are proposed checks; no test execution evidence was supplied by the documents.
- **What I changed or rejected:** I would reject statements such as “security is implemented,” “all tests pass,” or “the ticket workflow is approved” because the documents describe expectations and proposed tests rather than implementation results.
- **Why I changed it:** The README explicitly says that security considerations do not prove controls are implemented, and the PRD requires testing and acceptance against approved requirements.
- **How I checked the result:** Cross-checked the proposed checks against the PRD’s Security and Privacy, Testing and Acceptance, and Risks and Mitigations sections, plus the README’s Security and Privacy and Testing Strategy sections. No application tests were run as part of this document review.
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
