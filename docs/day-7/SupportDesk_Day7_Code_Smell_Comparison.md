# SupportDesk Day 7 --- Code-Smell Comparison

**Practice file:** `messy-express-app.js`\
**Purpose:** Compare the five initially shared AI findings with the
subsequent detailed 10-area inspection.

> **Attribution note:** The conversation contains the AI's first five
> findings and a separate detailed inspection covering ten areas. The
> source attribution of the ten-area inspection has not been explicitly
> confirmed. This document therefore compares the two available sets
> without claiming that the second set was definitely manual.

## 1. Comparison summary

  -------------------------------------------------------------------------------
  Topic                     AI first-five set Detailed 10-area  Comparison
                                              set
  ------------------------- ----------------- ----------------- -----------------
  Global mutable ticket     Identified        Not separately    AI-set only
  state                                       listed

  Non-descriptive predicate Identified        Not separately    AI-set only
  variable (`x`)                              listed

  Repetitive/inconsistent   Identified        Logging and       Overlap
  error handling                              error-message
                                              exposure
                                              discussed

  Fat route handlers /      Identified        Business rules    Overlap
  mixed responsibilities                      embedded in
                                              handlers
                                              discussed

  Magic numbers and         Identified        Capacity and      Overlap
  repeated literals                           validation limits
                                              discussed

  Missing/inconsistent      Not separately    Identified        Detailed-set only
  input validation          listed

  Incorrect ticket-limit    Not separately    Identified        Detailed-set only
  boundary                  listed

  Repeated filtering and    Not separately    Identified        Detailed-set only
  ticket lookup             listed

  Unsafe route ID           Not separately    Identified        Detailed-set only
  conversion                listed

  Inconsistent response     Not separately    Identified        Detailed-set only
  structure/serialization   listed

  Potentially unsuitable    Not separately    Identified        Detailed-set only
  HTTP status codes         listed

  Invalid query parameter   Not separately    Identified        Detailed-set only
  handling                  listed
  -------------------------------------------------------------------------------

## 2. Overlapping findings

### O-01 --- Error handling and logging

Both sets identify concerns around route-level error handling. The
detailed inspection adds concrete examples: raw exception logging,
inconsistent catch behavior and returning `e.message` to callers.

**Risk:** Inconsistent error responses make failures harder to handle
consistently. Exposing internal exception messages may disclose
implementation details.

**Focused improvement:** Follow one documented error-response convention
and avoid returning raw internal exception messages. Any shared error
middleware should be introduced only if approved for this exercise.

### O-02 --- Mixed responsibilities in route handlers

Both sets identify that route handlers combine HTTP handling with
business rules and data operations.

**Risk:** Logic is harder to reuse and test independently.

**Focused improvement:** Select one small, approved behavior to extract.
Do not redesign the entire application in this exercise.

### O-03 --- Hardcoded limits and values

Both sets identify hardcoded values such as title/description lengths,
ticket capacity and priority values.

**Risk:** The meaning and intended reuse of these values are less
obvious, and changes may require editing multiple locations.

**Focused improvement:** Introduce named constants for values that have
a clear shared meaning, subject to the agreed scope.

## 3. Findings present in only one set

### Present in the initial AI five

-   Global mutable state and lack of a data-access abstraction.
-   Non-descriptive single-letter predicate variable names.

These are not separately named in the detailed 10-area inspection.

### Present in the detailed 10-area inspection

-   Missing/inconsistent input validation.
-   Ticket-capacity boundary condition.
-   Repeated filtering and lookup logic.
-   Route ID conversion without positive-integer validation.
-   Business rules embedded in handlers.
-   Inconsistent response structures and serialization.
-   HTTP status-code questions.
-   Logging and error-message exposure.
-   Invalid query parameter handling, including repeated query keys.
-   Inconsistent single-ticket response mapping.

## 4. Disputed or qualified observations

  -----------------------------------------------------------------------
  Observation                         Qualification
  ----------------------------------- -----------------------------------
  Every string literal is a magic     Not necessarily. A string is not
  value                               automatically a code smell merely
                                      because it is hardcoded. Focus on
                                      values representing shared rules or
                                      domain constants.

  Capacity limit must return 422, 403 The correct status depends on the
  or 507                              API contract. Do not prescribe one
                                      without project conventions.

  Manually mapping response fields is Explicit mapping can protect
  inherently bad                      against exposing internal fields.
                                      The stronger issue is inconsistent
                                      mapping and omitted fields.

  Duplicate query keys crash the      In the supplied route, the error
  whole application                   should be caught by its route-level
                                      `try/catch`; it may produce a 500
                                      response rather than crash the
                                      process.

  `Number(req.params.id)` accepts     It can produce `NaN`, negative
  invalid IDs                         values or decimals. Validate the
                                      expected ID format before lookup.
  -----------------------------------------------------------------------

## 5. Overall conclusion

The two sets cover complementary maintainability, validation,
error-handling, business-rule and response-consistency concerns. The
overlap is strongest around error handling, mixed route responsibilities
and hardcoded business values.

Before submitting, confirm which set represents the manual review and
which represents the AI review. Then update the labels in this document
to **Both**, **Manual only**, **AI only** and **Disputed** using the
correct source attribution.

## 6. Next assignment step

Choose one small refactoring candidate and prepare a plan for mentor
approval. Do not edit the exercise application until approval is
received.
