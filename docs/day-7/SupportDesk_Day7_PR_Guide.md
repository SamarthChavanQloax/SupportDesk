# SupportDesk Day 7 – Git Commit and Pull Request (PR) Guide
**Topic:** Clean Code & MVC Fundamentals (Ticket Lookup Refactoring)
**Target File:** `messy-express-app.js`
**Workspace:** `D:\SupportD\Day7-Practice`

---

## 1. Step-by-Step Git Commands

### Option A: Committing to the Main SupportDesk Repository (Recommended)
If your lead/mentor asks you to include the Day 7 practice work into the main `SupportDesk` monorepo:

```powershell
# 1. Navigate to the main SupportDesk repository
cd D:\SupportD\SupportDesk

# 2. Ensure your local main branch is up-to-date
git checkout main
git pull origin main

# 3. Create and switch to a new feature branch
git checkout -b feature/day-7-clean-code-mvc

# 4. Copy the Day 7 documentation and exercise files into the repository
# (e.g., into docs/day-7/ or practice/day-7/)
New-Item -ItemType Directory -Force -Path "docs\day-7"
Copy-Item -Path "D:\SupportD\Day7-Practice\SupportDesk_Day7_Architecture_Note_EOD.md" -Destination "docs\day-7\"
Copy-Item -Path "D:\SupportD\Day7-Practice\SupportDesk_Day7_Request_Flow_Map.md" -Destination "docs\day-7\"
Copy-Item -Path "D:\SupportD\Day7-Practice\SupportDesk_Day7_Code_Smell_Comparison.md" -Destination "docs\day-7\"
Copy-Item -Path "D:\SupportD\Day7-Practice\messy-express-app.js" -Destination "docs\day-7\"

# 5. Review the staged files and diff
git status
git add docs\day-7

# 6. Commit with semantic conventional commit message
git commit -m "refactor(practice): extract findTicketIndexById helper for Day 7 clean code"

# 7. Push the feature branch to GitHub
git push -u origin feature/day-7-clean-code-mvc
```

---

### Option B: Committing inside the Isolated `Day7-Practice` Directory
If your practice folder itself should be a standalone Git repository:

```powershell
# 1. Navigate to the practice directory
cd D:\SupportD\Day7-Practice

# 2. Initialize a local repository
git init

# 3. Add .gitignore to exclude dependencies
"node_modules/`npackage-lock.json`n" | Out-File -Encoding utf8 .gitignore

# 4. Stage your files
git add messy-express-app.js SupportDesk_Day7_Architecture_Note_EOD.md SupportDesk_Day7_Request_Flow_Map.md SupportDesk_Day7_Code_Smell_Comparison.md focused-test.js full-verification.js .gitignore

# 5. Commit
git commit -m "refactor(practice): extract repeated ticket lookup logic into findTicketIndexById"
```

---

## 2. Pull Request (PR) Template for GitHub

When opening a Pull Request on GitHub (e.g. comparing `feature/day-7-clean-code-mvc` to `main`), use this template:

### **PR Title**
`refactor(practice): extract repeated ticket lookup logic into findTicketIndexById (Day 7)`

### **PR Description**

```markdown
## Summary
This PR implements the single mentor-approved refactoring for the **Day 7 Clean Code and MVC Fundamentals** assignment on `messy-express-app.js`.

### What Changed
- Extracted repeated ticket lookup expressions into one reusable helper function:
  ```javascript
  function findTicketIndexById(id) {
    return tickets.findIndex((ticket) => ticket.id === id);
  }
  ```
- Replaced duplicated array lookups in three routes:
  1. `GET /tickets/:id`
  2. `POST /tickets/:id/close`
  3. `DELETE /tickets/:id`
- Preserved existing behavior 100%: no endpoint URLs, status codes, error messages, validation rules, or response shapes were altered.
- Backed up initial baseline and prototype implementations.

---

## Code Smell Register Summary
- **Primary Issue Addressed:** Code duplication across ID-based route lookups and use of ambiguous parameter naming (`x` -> `ticket`).
- **Deferred Refactorings (Documented in EOD Note):** Full MVC directory restructuring (controllers/services/repositories), centralized Express error middleware, and input sanitization remain intentionally deferred per mentor-approved scope.

---

## Verification Evidence

### 1. Syntax Validation
```powershell
node --check .\messy-express-app.js
# Exit Code: 0 (Clean)
```

### 2. Automated Test Results
Executed `focused-test.js` (with active readiness polling and fresh process isolation):
- [x] `TC-01: GET /tickets/1` -> `200 OK` (Existing ticket returned)
- [x] `TC-02: GET /tickets/999` -> `404 Not Found` ("Ticket not found")
- [x] `TC-03: POST /tickets/1/close` -> `200 OK` (Ticket closed with confirm true)
- [x] `TC-04: POST /tickets/999/close` -> `404 Not Found` ("Ticket not found")
- [x] `TC-05: DELETE /tickets/3` -> `200 OK` (Closed ticket deleted)
- [x] `TC-06: DELETE /tickets/999` -> `404 Not Found` ("Ticket not found")

Full 13-endpoint regression test (`full-verification.js`): **13/13 Passed**.

---

## PR Checklist
- [x] Code strictly adheres to approved scope (single helper extracted).
- [x] No unrelated dependencies or configuration added.
- [x] 100% behavioral equivalence verified against baseline before and after refactoring.
- [x] Tests executed and passed.
- [x] Architecture Note and EOD report updated.
```
