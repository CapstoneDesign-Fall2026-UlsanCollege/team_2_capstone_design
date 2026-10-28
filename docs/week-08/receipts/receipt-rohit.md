# Individual Evidence Receipt — Rohit Chhantyal

**Student:** Rohit Chhantyal  
**GitHub Login:** `Rohit-coder201`  
**Team:** Team 2 — BrewMellow  
**Week:** 8 (Midterm Gate Checkpoint)  
**Date:** October 28, 2026  

---

## Receipt 1: Identity Confirmation & Outage Resilience Reflection

- **What I did:** Confirmed my canonical identity (`Rohit Chhantyal` $\leftrightarrow$ `@Rohit-coder201`) across all team documentation, presentation materials, and receipts. Reviewed our Midterm outage resilience demonstration (handling backend downtime with explicit UI alerts rather than silent crashes) and formulated our Sprint 2 resilience requirements.
- **Evidence link:** [`docs/week-06/api-smoke-test-record.md`](../../week-06/api-smoke-test-record.md), [`README.md#smoke-testing`](../../README.md#4-repeatable-smoke-command-script), [`../weekly-report.md#8-individual-contribution-entries--one-row-per-enrolled-student`](../weekly-report.md#8-individual-contribution-entries--one-row-per-enrolled-student)
- **How I checked it:** Audited the repository git history and confirmed all commit author metadata and markdown presentation files use the canonical spelling `Rohit Chhantyal`. Re-verified repeatable curl smoke test commands against `http://localhost:8000/api/orders/`.
- **What I learned or changed:** Systems must be designed with failure modes in mind from day one; graceful degradation provides far superior user experience during service interruptions.

---

## Receipt 2: Transactional Email Infrastructure & Notification Workflow

- **What I did:** Drafted the technical requirements and architecture for Sprint 2 transactional email dispatch via SMTP. Designed the background notification worker that sends automated order confirmation receipts and shipping updates once Khalti payment verification succeeds.
- **Evidence link:** [`../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911`](../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911), [`docs/week-07/sprint-1-quality-quick-checks.md`](../../week-07/sprint-1-quality-quick-checks.md)
- **How I checked it:** Tested Django's built-in email backend with test console logging, confirming that order metadata (customer name, origin terroir, quantity, price in NPR, and delivery address) can be serialized cleanly into responsive HTML templates.
- **What I learned or changed:** Decoupling transactional emails from the main HTTP request-response cycle prevents payment confirmation timeouts if an SMTP provider experiences latency.
