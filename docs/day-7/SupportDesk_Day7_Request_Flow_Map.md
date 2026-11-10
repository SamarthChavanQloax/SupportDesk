# SupportDesk Day 7 --- Request-Flow Map

**Practice file:** `Day7-Practice/messy-express-app.js`\
**Purpose:** Document how the supplied Express application currently
processes requests.\
**Scope:** Documentation only. No application code has been changed.

## 1. Current request flow

``` mermaid
flowchart TD
    A[Client sends HTTP request] --> B[Express receives request]
    B --> C{Route matches?}
    C -- No --> Z[404 response]
    C -- Yes --> D[Route handler]
    D --> E[Read params, query or body]
    E --> F[Validate input and apply business rules]
    F --> G{Request accepted?}
    G -- No --> H[Return route-specific error response]
    G -- Yes --> I[Read or modify in-memory tickets array]
    I --> J[Build JSON response]
    J --> K[Send HTTP response]
    D -. exception .-> L[Route-level catch block]
    L --> M[Return route-specific 500 response]
```

The application handles request parsing, validation, business rules,
data operations and response formatting inside route handlers. Ticket
data is stored in an in-memory array; the supplied file does not show a
database or a separate repository/service layer.

## 2. Endpoint flow map

  --------------------------------------------------------------------------------------------------
  Method and endpoint            Main processing               Data operation    Typical outcome
  ------------------------------ ----------------------------- ----------------- -------------------
  `GET /tickets`                 Reads optional status,        Reads `tickets`   Returns filtered
                                 priority and owner filters;                     tickets and count
                                 filters the ticket collection

  `GET /tickets/:id`             Converts the route ID to a    Reads `tickets`   Returns one ticket
                                 number, looks up the ticket                     or 404
                                 and builds a selected
                                 response object

  `POST /tickets`                Reads body fields, validates  Adds a ticket to  Returns created
                                 title/description/priority,   `tickets`;        ticket or
                                 checks capacity and duplicate increments        validation/server
                                 open tickets, assigns an ID   `nextId`          error

  `POST /tickets/:id/close`      Converts ID, finds ticket,    Updates a ticket  Returns updated
                                 checks current status and     in `tickets`      ticket or an error
                                 high-priority confirmation,
                                 sets closure fields

  `DELETE /tickets/:id`          Converts ID, finds ticket,    Removes ticket    Returns deleted
                                 checks that it is closed      from `tickets`    ticket or an error

  `GET /tickets/stats/summary`   Calculates total, status and  Reads `tickets`   Returns summary
                                 priority counts               repeatedly using  statistics
                                                               filters

  `GET /health`                  Returns service health        No ticket data    Returns health
                                 information                   operation         response

  Unmatched routes               Handles requests that do not  None              Returns 404
                                 match a defined endpoint
  --------------------------------------------------------------------------------------------------

## 3. Request-processing responsibilities currently combined in route handlers

1.  **HTTP handling:** Route matching and reading `req.params`,
    `req.query` and `req.body`.
2.  **Input validation:** Checking required fields, lengths, priority
    values and IDs.
3.  **Business rules:** Duplicate-ticket checks, ticket capacity,
    closure rules, confirmation for high-priority tickets and deletion
    restrictions.
4.  **Data access and mutation:** Searching, filtering, inserting,
    updating and deleting entries in the in-memory `tickets` array.
5.  **Response formatting:** Constructing JSON success and error
    payloads.
6.  **Error handling:** Catching exceptions within individual route
    handlers.

These are observations about the supplied exercise file. They do not
establish that SupportDesk's final architecture has been approved.

## 4. Simplified flow for creating a ticket

``` mermaid
flowchart TD
    A[POST /tickets] --> B[Read title, description, priority and owner]
    B --> C{Input valid?}
    C -- No --> D[Return 400 validation response]
    C -- Yes --> E{Ticket capacity reached?}
    E -- Yes --> F[Return capacity error]
    E -- No --> G{Duplicate open ticket?}
    G -- Yes --> H[Return duplicate error]
    G -- No --> I[Create ticket with next ID]
    I --> J[Add ticket to in-memory array]
    J --> K[Return 201 with created ticket]
```

## 5. Error and not-found paths

-   An unmatched URL is handled by the final 404 route.
-   A ticket lookup that finds no matching ID returns a route-specific
    404 response.
-   Validation and business-rule failures return route-specific error
    responses.
-   Exceptions are caught inside route handlers, but the error logging
    and response messages are not consistent across all handlers.
-   The application does not show one shared error-handling middleware
    for these route exceptions.

## 6. Current architecture observation

**Observed in the supplied file:** Express route handlers directly
perform request parsing, business-rule checks, in-memory data
access/mutation and response formatting.

**Not present in the supplied file:** Separate controller, service or
repository modules; persistent database access; shared
request-validation middleware; shared error-handling middleware.

**Important:** This map documents the training application's current
implementation. It is not a proposal to impose an unapproved
architecture on the SupportDesk repository.

## 7. Verification status

-   This document is based on the supplied `messy-express-app.js`
    inspection and the route behavior described during the exercise.
-   No application code was modified as part of preparing this map.
-   No tests or runtime commands were executed to verify the
    application.
-   Confirm line numbers against the saved local file before using them
    in a final submission, because editor line numbering may differ if
    the file has changed.
