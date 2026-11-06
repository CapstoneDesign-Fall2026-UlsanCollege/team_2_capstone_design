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


4. **No synchronous setState in effects (`react-hooks/set-state-in-effect`, CI-blocking error):**
   - Never call `setX(...)` directly in a `useEffect` body, including via a helper such as `loadX()` that sets state synchronously.
   - Derive values during render, or sync props to state with the "adjust state during render" pattern (`if (prop !== prev) { setPrev(prop); setX(...) }`).
   - For data fetching, initialise `loading` to `true` and call setState only inside `.then`/`.catch` callbacks. Do not call `setLoading(true)` or `setError(null)` at the top of the effect.
   - CI runs `npm --prefix frontend run lint`. Errors fail the push to main, so run lint locally before committing.
