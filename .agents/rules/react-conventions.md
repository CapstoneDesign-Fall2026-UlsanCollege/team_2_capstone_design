---
name: frontend-react-conventions
description: "React hook rules and memoization guidelines: avoid optional chaining in dependency arrays and avoid unnecessary useMemo on trivial derivations."
trigger: always_on
---

# React Hook & Memoization Conventions

Enforce these conventions across all frontend React/Next.js code (`frontend/src/**/*`):

1. **No Optional Chaining in Dependency Arrays:**
   - Never use optional chaining (`?.`) or complex property chains in hook dependency arrays (`useMemo`, `useCallback`, `useEffect`).
   - ESLint (`react-hooks/exhaustive-deps`) flags this as invalid / unanalyzable.
   - *Bad:*
     ```tsx
     useMemo(() => ..., [overview?.recent_orders]);
     ```
   - *Good (if memoization is truly needed):*
     ```tsx
     const recentOrders = overview?.recent_orders;
     useMemo(() => ..., [recentOrders]);
     ```

2. **Avoid Premature / Trivial Memoization:**
   - Do not wrap simple, cheap derivations (e.g., `.filter()`, `.map()`, `.length`, basic boolean / numeric arithmetic on small lists) in `useMemo`.
   - Compute directly during render:
     ```tsx
     const khaltiProblemsCount = overview?.recent_orders
       ? overview.recent_orders.filter(isKhaltiProblem).length
       : 0;
     ```

3. **Always Run Lint Validation:**
   - Whenever editing React components or hooks, ensure `npm run lint` passes without hook dependency warnings or errors.
