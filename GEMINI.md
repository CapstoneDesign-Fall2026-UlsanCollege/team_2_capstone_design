## Mandatory UI Rule

Before any UI work, read `DESIGN.md` fully. Its rules override your defaults. Never deviate without asking the user. If chat messages and `DESIGN.md` ever disagree, `DESIGN.md` wins.

<!-- GSD:project-start source:PROJECT.md -->

## Project

**ShopCraft**

ShopCraft is a multi-tenant e-commerce and subscription SaaS platform ("Shopify for Nepal") where Nepali merchants sign up, launch a branded storefront at `/s/{storeSlug}`, sell products as one-time purchases or non-recurring subscriptions, and receive payments directly via Khalti (sandbox/live) or Cash on Delivery (COD). BrewMellow (Boutique Himalayan Coffee) is preserved and seeded as Tenant #1, the flagship demo store.

**Core Value:** Strict multi-tenant isolation and end-to-end checkout integrity — any merchant can launch an isolated storefront and fulfill verified Khalti or COD orders without ever leaking data across stores or breaking the frozen BrewMellow baseline.

### Constraints

- **Timeline**: Hard deadline **2026-11-26** (4 weeks: Oct 30 – Nov 26); feature freeze **2026-11-24** — solo developer executing end-to-end
- **Budget**: $0 out-of-pocket — all infrastructure covered by GitHub Student Developer Pack credits and free tiers
- **Safety / Baseline**: Legacy BrewMellow production (`main` / `legacy/brewmellow-v1` + original Neon `main` branch) is frozen read-only until final cutover rehearsal passes
- **Security**: Money stored as integer paisa (`price_minor`) and repriced exclusively on the server; Khalti return URL query params never trusted without server-side `epayment/lookup/` verification; `store` never accepted from request bodies

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
