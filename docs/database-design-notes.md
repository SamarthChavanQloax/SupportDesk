# SupportDesk â€“ Database Design Notes
**Assignment:** Day 8 â€“ Database Design with AI
**Author:** Senior Database Engineer & Technical Mentor
**Date:** 2026-11-06
**Status:** PROPOSED ARCHITECTURE â€” PENDING MENTOR APPROVAL

---

## 1. Executive Summary & Source Reconciliations

This document establishes the formal entity and relationship analysis for SupportDesk's relational database. Because SupportDesk is transitioning from conceptual planning to database implementation, three primary source documents provide input:

1. **The Product Requirements Document (PRD):** [`docs/SupportDesk_PRD_Redesigned_Compressed.docx`](file:///D:/SupportD/SupportDesk/docs/SupportDesk_PRD_Redesigned_Compressed.docx) (v0.1 Draft, unapproved).
2. **The Repository Architecture Specification:** [`README.md`](file:///D:/SupportD/SupportDesk/README.md) (Planning stage).
3. **The Day 8 Database Design Assignment Specification:** Day 8 curriculum requirements.

To adhere strictly to engineering rigor, requirements across these sources are explicitly separated below. Conflicting definitions are cataloged and marked as `PENDING MENTOR APPROVAL` rather than resolved by unilateral assumption.

---

## 2. Requirements Traceability Matrix

### 2.1 Requirements Explicitly Documented in the PRD (Draft v0.1)
* **Core Entities:** `User`, `Ticket`, `TicketResponse`, `TicketHistory`.
* **User Identity:** Must store user accounts (`name`, `email`, `role`, `active`, `created_at`, password hash or auth provider reference).
* **Ticket Data:** Must store title, description, status, priority, creation/update timestamps, and resolution timestamp (`resolved_at`).
* **Ticket Reference:** Explicit requirement (FR-03, US-01, Section 11) for a human-readable unique reference string shown to the customer upon submission.
* **Direct Ownership:** Each ticket is created by a customer (`customer_id`) and assigned to an agent (`assignee_id`). Unassigned tickets are permitted.
* **Response Visibility:** `TicketResponse` proposes a `visibility` attribute to distinguish public replies from private internal agent notes (pending approval).
* **Audit History:** `TicketHistory` records traceable field changes with `actor_id`, `action`, `old_value`, `new_value`, and `created_at`.
* **Access Boundary:** Customer accounts must be strictly restricted to accessing only their own tickets.

### 2.2 Requirements from the Day 8 Assignment
* **Technology Stack:** PostgreSQL database managed via Prisma ORM within an Express/TypeScript backend.
* **Core Entity List:** `USER`, `TICKET`, `COMMENT`, `TAG`, `ATTACHMENT`, `AUDIT LOG`.
* **Enum Standards:**
  * Role Enum: `customer`, `agent`, `admin`
  * Status Enum: `open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`
  * Priority Enum: `P1`, `P2`, `P3`, `P4`
* **Many-to-Many Association:** Explicit requirement to investigate a many-to-many relationship between `Ticket` and `Tag`.
* **Parent Entity for Attachments:** Requires analyzing whether attachments belong directly to `Ticket`, `Comment`, or both.
* **Sample Data Seed:** Exactly 50 fictional sample tickets seeded using CSV $\rightarrow$ JSON conversion.

### 2.3 Concepts Present Only in the README.md
* **Relational Lookup Tables:** Proposes normalized tables with integer primary keys for `ROLE`, `STATUS`, and `PRIORITY` instead of native PostgreSQL enums.
* **Separate Assignment Table:** Models ticket assignment as an independent transaction table (`ASSIGNMENT` with `assignment_id`, `ticket_id`, `agent_id`, `assigned_by`, `assigned_at`) to preserve historical assignment re-delegation.
* **Numeric-Only Ticket ID:** Does not include the PRD's alphanumeric `reference` string in the conceptual ERD.
* **Single Attachment Link:** `ATTACHMENT` links strictly to `ticket_id` (`file_name`, `file_path`, `uploaded_at`).

---

## 3. Catalog of Conflicting Requirements

| Topic | PRD (Draft v0.1) | README.md | Day 8 Assignment | Status / Proposed Alignment |
|---|---|---|---|---|
| **Role Modeling** | Attribute `role` on `User` | Lookup table `ROLE (role_id, role_name)` | Native Enum: `customer, agent, admin` | `PENDING MENTOR APPROVAL`: Recommend native PostgreSQL Enum for Prisma type-safety. |
| **Status Modeling** | Attribute `status` on `Ticket` | Lookup table `STATUS (status_id, status_name)` | Native Enum: `open, in_progress, waiting_on_customer, resolved, closed` | `PENDING MENTOR APPROVAL`: Recommend native PostgreSQL Enum. Notice `waiting_on_customer` added. |
| **Priority Modeling** | Attribute `priority` on `Ticket` | Lookup table `PRIORITY (priority_id, priority_name)` | Native Enum: `P1, P2, P3, P4` | `PENDING MENTOR APPROVAL`: Day 7 used `low, medium, high`; Day 8 specifies `P1-P4`. Need confirmed naming. |
| **Assignment Storage** | Direct FK `assignee_id` on `Ticket` | Separate `ASSIGNMENT` table with `assigned_by` | Direct assignment on `Ticket` | `PENDING MENTOR APPROVAL`: Direct `assignee_id` on `Ticket` for MVP, audit changes via `AuditLog`. |
| **Responses vs Comments** | Named `TicketResponse` with `visibility` | Named `RESPONSE` with `message` | Named `COMMENT` | `PENDING MENTOR APPROVAL`: Align naming to `Comment` with boolean `isInternal` flag. |
| **Tags Entity** | Not mentioned | Not mentioned | Core entity `TAG` with M:N relationship to `TICKET` | `PENDING MENTOR APPROVAL`: Include `Tag` and `TicketTag` join table per Day 8 requirements. |
| **Ticket Reference** | Explicit `reference` field (e.g. `TCK-1001`) | Not in ERD (uses `ticket_id` PK only) | Not explicitly detailed | `PENDING MENTOR APPROVAL`: Add unique alphanumeric `reference` field alongside numeric PK. |
| **Attachment Scope** | Candidate capability (storage unconfirmed) | Linked strictly to `Ticket` | Investigate parent (`Ticket` vs `Comment`) | `PENDING MENTOR APPROVAL`: Allow attachment to link to `Ticket`, with optional `comment_id`. |

---

## 4. Assumptions and Open Questions

1. **Soft Deletion vs Hard Deletion:** The PRD raises soft deletion as an open question. In enterprise support systems, deleting tickets or audit logs breaks compliance. *Assumption:* Implement soft deletion (`deleted_at TIMESTAMP WITH TIME ZONE NULL`) on `Ticket` and `Comment`, while restricting `User` deletion.
2. **User Identity & Passwords:** Will SupportDesk use internal JWT credentials or an external OAuth identity provider? *Assumption:* Provide `password_hash VARCHAR(255) NULL` to support local credentials while allowing federated auth.
3. **Internal Agent Notes:** Support agents frequently require internal discussion threads hidden from customers. *Assumption:* Include `is_internal BOOLEAN NOT NULL DEFAULT FALSE` on `Comment`.
4. **File Storage Mechanism:** Attachments cannot be stored directly in PostgreSQL records. *Assumption:* Store metadata (`file_name`, `file_path`/`storage_key`, `file_size`, `mime_type`) in the database; binary blobs reside on local disk/S3.

---

## 5. Detailed Proposed Entity Analysis

### 5.1 `User` Model
* **Purpose:** Represents all human actors interacting with SupportDesk (Customers, Support Agents, Administrators).
* **Fields:**
  * `id`: `INTEGER` (Auto-increment) | Required | **Primary Key**
  * `email`: `VARCHAR(255)` | Required | **Unique Constraint** | Normalized lowercase email.
  * `name`: `VARCHAR(100)` | Required | Display name of the user.
  * `password_hash`: `VARCHAR(255)` | Optional | Secure bcrypt/argon2 hash (nullable for OAuth accounts).
  * `role`: `Enum(Role)` | Required | Default: `customer`. Values: `customer`, `agent`, `admin`.
  * `is_active`: `BOOLEAN` | Required | Default: `true`. Deactivation flag instead of hard deletion.
  * `created_at`: `TIMESTAMP WITH TIME ZONE` | Required | Default: `NOW()`.
  * `updated_at`: `TIMESTAMP WITH TIME ZONE` | Required | Auto-updated on modification.
* **Relationships:**
  * One-to-Many with `Ticket` (`created_tickets` via `customer_id`): $1 \rightarrow 0..N$.
  * One-to-Many with `Ticket` (`assigned_tickets` via `assignee_id`): $1 \rightarrow 0..N$.
  * One-to-Many with `Comment` (`comments` via `author_id`): $1 \rightarrow 0..N$.
  * One-to-Many with `AuditLog` (`audit_logs` via `actor_id`): $1 \rightarrow 0..N$.
* **Integrity & Business Rules:**
  * `customer_id` on a ticket must reference a User with `role = customer` (or any valid submitter).
  * `assignee_id` on a ticket must reference a User with `role = agent` or `role = admin`.
  * Users cannot be hard-deleted if they are referenced by existing tickets or comments (`ON DELETE RESTRICT`).

---

### 5.2 `Ticket` Model
* **Purpose:** The core aggregate root representing a customer's support request through its entire lifecycle.
* **Fields:**
  * `id`: `INTEGER` (Auto-increment) | Required | **Primary Key**
  * `reference`: `VARCHAR(30)` | Required | **Unique Constraint** | Human-readable public reference (e.g. `TCK-2026-0001`).
  * `title`: `VARCHAR(150)` | Required | Brief summary of the issue (min 3 chars).
  * `description`: `TEXT` | Required | Detailed explanation of the reported problem.
  * `status`: `Enum(TicketStatus)` | Required | Default: `open`. Values: `open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`.
  * `priority`: `Enum(TicketPriority)` | Required | Default: `P3`. Values: `P1` (Critical), `P2` (High), `P3` (Medium), `P4` (Low).
  * `customer_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `User.id` (`ON DELETE RESTRICT`).
  * `assignee_id`: `INTEGER` | Optional | Foreign Key $\rightarrow$ `User.id` (`ON DELETE SET NULL`). Nullable when unassigned.
  * `created_at`: `TIMESTAMP WITH TIME ZONE` | Required | Default: `NOW()`.
  * `updated_at`: `TIMESTAMP WITH TIME ZONE` | Required | Auto-updated on update.
  * `resolved_at`: `TIMESTAMP WITH TIME ZONE` | Optional | Timestamp when status changed to `resolved`.
  * `closed_at`: `TIMESTAMP WITH TIME ZONE` | Optional | Timestamp when status changed to `closed`.
  * `deleted_at`: `TIMESTAMP WITH TIME ZONE` | Optional | Soft-delete timestamp.
* **Relationships:**
  * Many-to-One with `User` (`customer`): $N \rightarrow 1$.
  * Many-to-One with `User` (`assignee`): $N \rightarrow 0..1$.
  * One-to-Many with `Comment`: $1 \rightarrow 0..N$ (`ON DELETE CASCADE`).
  * One-to-Many with `Attachment`: $1 \rightarrow 0..N$ (`ON DELETE CASCADE`).
  * One-to-Many with `TicketTag`: $1 \rightarrow 0..N$ (`ON DELETE CASCADE`).
  * One-to-Many with `AuditLog`: $1 \rightarrow 0..N$ (`ON DELETE CASCADE`).
* **Integrity & Business Rules:**
  * A customer cannot set `assignee_id`.
  * When status transitions to `resolved`, `resolved_at` must be recorded.
  * When status transitions to `closed`, `closed_at` must be recorded.
  * Tickets cannot be deleted if active; soft-deletion preserves audit trails.

---

### 5.3 `Comment` Model (Ticket Responses)
* **Purpose:** Threaded communication history between customers and support agents regarding a specific ticket.
* **Fields:**
  * `id`: `INTEGER` (Auto-increment) | Required | **Primary Key**
  * `ticket_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `Ticket.id` (`ON DELETE CASCADE`).
  * `author_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `User.id` (`ON DELETE RESTRICT`).
  * `body`: `TEXT` | Required | Message content.
  * `is_internal`: `BOOLEAN` | Required | Default: `false`. True if internal staff note hidden from customer.
  * `created_at`: `TIMESTAMP WITH TIME ZONE` | Required | Default: `NOW()`.
  * `updated_at`: `TIMESTAMP WITH TIME ZONE` | Required | Auto-updated.
  * `deleted_at`: `TIMESTAMP WITH TIME ZONE` | Optional | Soft-delete timestamp.
* **Relationships:**
  * Many-to-One with `Ticket`: $N \rightarrow 1$.
  * Many-to-One with `User`: $N \rightarrow 1$.
  * One-to-Many with `Attachment`: $1 \rightarrow 0..N$.
* **Integrity & Business Rules:**
  * Customers cannot view or author comments where `is_internal = true`.
  * Author must have permission to access the parent ticket.

---

### 5.4 `Tag` Model & `TicketTag` Join Table
* **Purpose:** Categorization labels for organizing tickets across technical components, teams, or issue categories (e.g., `billing`, `network`, `hardware`, `bug`).
* **`Tag` Fields:**
  * `id`: `INTEGER` (Auto-increment) | Required | **Primary Key**
  * `name`: `VARCHAR(50)` | Required | **Unique Constraint** | Lowercase normalized tag label.
  * `color`: `VARCHAR(7)` | Optional | Hex code for UI rendering (e.g. `#FF0000`).
  * `created_at`: `TIMESTAMP WITH TIME ZONE` | Required | Default: `NOW()`.
* **`TicketTag` Join Fields:**
  * `ticket_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `Ticket.id` (`ON DELETE CASCADE`).
  * `tag_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `Tag.id` (`ON DELETE CASCADE`).
  * `assigned_at`: `TIMESTAMP WITH TIME ZONE` | Required | Default: `NOW()`.
  * **Composite Primary Key:** `PRIMARY KEY (ticket_id, tag_id)`
* **Cardinality:** Many-to-Many between `Ticket` and `Tag` ($N \leftrightarrow M$).

---

### 5.5 `Attachment` Model
* **Purpose:** Metadata records for file attachments uploaded by users to substantiate tickets or responses.
* **Fields:**
  * `id`: `INTEGER` (Auto-increment) | Required | **Primary Key**
  * `ticket_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `Ticket.id` (`ON DELETE CASCADE`).
  * `comment_id`: `INTEGER` | Optional | Foreign Key $\rightarrow$ `Comment.id` (`ON DELETE SET NULL`).
  * `uploader_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `User.id` (`ON DELETE RESTRICT`).
  * `file_name`: `VARCHAR(255)` | Required | Original uploaded filename.
  * `file_path`: `VARCHAR(500)` | Required | Relative disk path or object storage URI.
  * `file_size`: `INTEGER` | Required | Size in bytes.
  * `mime_type`: `VARCHAR(100)` | Required | Content type (e.g., `image/png`, `application/pdf`).
  * `created_at`: `TIMESTAMP WITH TIME ZONE` | Required | Default: `NOW()`.
* **Integrity & Business Rules:**
  * Disallow dangerous executable extensions (`.exe`, `.sh`, `.bat`).
  * Enforce maximum upload payload limit at application boundary.

---

### 5.6 `AuditLog` Model (Ticket History)
* **Purpose:** Append-only historical ledger capturing administrative actions, status transitions, and ownership changes.
* **Fields:**
  * `id`: `INTEGER` (Auto-increment) | Required | **Primary Key**
  * `ticket_id`: `INTEGER` | Required | Foreign Key $\rightarrow$ `Ticket.id` (`ON DELETE CASCADE`).
  * `actor_id`: `INTEGER` | Optional | Foreign Key $\rightarrow$ `User.id` (`ON DELETE SET NULL`). Nullable for automated system actions.
  * `action`: `VARCHAR(100)` | Required | Action verb (e.g., `STATUS_CHANGED`, `TICKET_ASSIGNED`, `PRIORITY_UPDATED`).
  * `field_changed`: `VARCHAR(50)` | Optional | The specific attribute modified.
  * `old_value`: `TEXT` | Optional | Previous value serialized as string/JSON.
  * `new_value`: `TEXT` | Optional | Updated value serialized as string/JSON.
  * `created_at`: `TIMESTAMP WITH TIME ZONE` | Required | Default: `NOW()`.
* **Integrity & Business Rules:**
  * Strictly append-only: updates and deletes are prohibited on the audit ledger.

---

## 6. Recommended Index Decisions & Query Performance Review

Every proposed index must correspond to an actual query pattern documented in the PRD, API outline, or Day 8 requirements:

| Index Name | Target Table | Columns | Documented Query Pattern | Performance Justification |
|---|---|---|---|---|
| `idx_users_email` | `User` | `email` | User authentication (`POST /api/auth/login`) | Fast $O(1)$ B-Tree lookup for login requests. |
| `idx_tickets_reference` | `Ticket` | `reference` | Customer ticket tracking by public reference | Fast $O(1)$ unique point lookup. |
| `idx_tickets_customer_id` | `Ticket` | `customer_id` | Customer portal: "View Own Tickets" (`GET /api/tickets?mine=true`) | Eliminates table scans when customers view their support history. |
| `idx_tickets_assignee_status` | `Ticket` | `assignee_id, status` | Agent queue: "List Assigned Tickets by Status" | Composite index supporting filtered agent queues with zero disk sort. |
| `idx_tickets_status_priority` | `Ticket` | `status, priority` | Admin dashboard: Ticket triage and filtering | Composite index speeding up operational triage queries. |
| `idx_comments_ticket_created` | `Comment` | `ticket_id, created_at` | Retrieve ticket conversation thread (`GET /api/tickets/{id}/responses`) | Covers foreign key join and sorts chronologically in index order. |
| `idx_audit_logs_ticket_id` | `AuditLog` | `ticket_id, created_at` | Retrieve ticket activity history (`GET /api/tickets/{id}/history`) | Fast retrieval of history records in chronological sequence. |
| `idx_ticket_tags_tag_id` | `TicketTag` | `tag_id` | Filter tickets by tag | Reverse index for join table lookups by tag name. |

---

## 7. Summary of Decisions Awaiting Mentor Approval

The following items are designated `PENDING MENTOR APPROVAL` before any Prisma schema implementation or database migration:

1. **Enum Types vs Relational Lookup Tables:** Confirm using PostgreSQL Enums (`Role`, `TicketStatus`, `TicketPriority`) over separate lookup tables.
2. **Priority Scale:** Confirm adopting `P1, P2, P3, P4` (per Day 8) versus `low, medium, high` (from Day 7).
3. **Ticket Assignment Model:** Confirm using direct `assignee_id` foreign key on `Ticket` rather than the separate `ASSIGNMENT` history table.
4. **Ticket Reference Code:** Confirm generating an alphanumeric reference string (e.g. `TCK-0001`) alongside the auto-incrementing integer ID.
5. **Tags Inclusion:** Confirm adding the `Tag` model and `TicketTag` many-to-many relationship as specified in Day 8.
6. **Attachment Linking:** Confirm whether attachments link to `Ticket`, `Comment`, or both.
