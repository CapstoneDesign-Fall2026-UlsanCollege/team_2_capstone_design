---
name: shopcraft-design-system
description: "Mandatory UI/UX rules for ShopCraft across Platform, Console, and Storefront surfaces. Always read DESIGN.md before any frontend or UI work."
trigger: always_on
---

# Mandatory Design System Contract

Before any UI, frontend layout, styling, copywriting, or component work, read `DESIGN.md` at the repository root in full.

1. **Precedence:** `DESIGN.md` overrides all default styling habits. Never deviate from `DESIGN.md` without asking the user first. If chat history and `DESIGN.md` ever disagree, `DESIGN.md` wins.
2. **Surface Isolation:** Platform (`/`, `/login`, `/signup`), Console (`/merchant/[storeSlug]`), and Storefront (`/s/[storeSlug]`) must never leak tokens into one another. Zero raw hex values inside `/s/*` components (`bg-sf-*`, `text-sf-*` only).
3. **Definition of Done:** Run every checkbox in `DESIGN.md` Section 7 before declaring any UI task complete.
