# Individual Evidence Receipt — Rohit Chhantyal

**Student:** Rohit Chhantyal  
**GitHub Login:** `Rohit-coder201`  
**Team:** Team 2 — BrewMellow  
**Week:** 7  
**Date:** October 15, 2026 (Updated October 21, 2026)  

---

## Receipt 1: Backend Resilience & Dedicated Slide 8 Presentation

- **What I did:** Prepared and rehearsed Slide 8 of the midterm presentation, explaining how our system handles backend API downtime and network interruptions gracefully with explicit frontend connection alerts instead of white-screen crashes, backed by repeatable README curl smoke tests.
- **Evidence link:** [api-smoke-test-record.md](../../week-06/api-smoke-test-record.md), [presentation-slides.md](../presentation-slides.md#slide-8-78-individual-contribution-rohit-chhantyal-rohit-coder201), [midterm-demo-script.md](../midterm-demo-script.md#slide-8-78-individual-contribution-rohit-chhantyal-315--340)
- **How I checked it:** Re-verified the repeatable curl command against `http://localhost:8000/api/orders/` and confirmed that stopping the backend triggers an explicit user alert rather than an unhandled frontend white-screen crash.
- **What I learned or changed:** Addressing failure modes and system recovery demonstrates technical depth and fulfills the resilience aspects of the midterm rubric.

---

## Receipt 2: Sprint 1 Quality Quick Checks & Sprint 2 Resilience Planning

- **What I did:** Co-authored the Sprint 1 Quality Quick Checks, validating zero secrets in git history, clean environment files, and safe synthetic test data. Contributed resilience requirements for Sprint 2 (Khalti integration and transactional email verification).
- **Evidence link:** [sprint-1-quality-quick-checks.md](../sprint-1-quality-quick-checks.md), [work-checklist.md](../work-checklist.md)
- **How I checked it:** Validated that git status and `.gitignore` exclude all `.env` files and confirmed all demo accounts use synthetic test profiles.
- **What I learned or changed:** Auditing code quality gates prior to the midterm gives the entire team high confidence during live demonstrations.
