# Individual Evidence Receipt — Rohit Chhantyal

**Student:** `Rohit-coder201` (Rohit Chhantyal)  
**Team:** Team 2 — BrewMellow  
**Week:** 6  
**Date:** October 14, 2026  

---

## Receipt 1: End-to-End API Smoke Testing & Recovery Validation
- **What I did:** Conducted API integration smoke tests on `POST /api/orders/` under two test scenarios: backend service active vs. backend service stopped.
- **Evidence link:** [API Smoke Test Record](../api-smoke-test-record.md), [Commit 5d61dd6](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5d61dd6)
- **How I checked it:** Ran curl command checks and manual UI submissions with Django online (HTTP 201) and offline (connection refused). Confirmed error banner and retry logic.
- **What I learned or changed:** Handling API unavailability gracefully in the frontend prevents lost customer input and allows immediate recovery once the server restarts.

---

## Receipt 2: Repeatable Smoke Test Script in Project Documentation
- **What I did:** Documented repeatable curl and health-check command steps in the project documentation so any team member can verify backend/frontend readiness in under 60 seconds.
- **Evidence link:** [Repeatable Smoke Test in README.md](../../../README.md), [Commit e25efce](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/e25efce)
- **How I checked it:** Ran the commands from a clean terminal session and verified expected HTTP status codes.
- **What I learned or changed:** Automated smoke commands provide immediate confidence before committing or rehearsing demos.
