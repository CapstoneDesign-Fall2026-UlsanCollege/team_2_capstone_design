# Week 11 GitHub Actions CI Validation — ShopCraft

**Workflow File:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)  
**Latest Verified `main` Run:** [`Run #74 (44248144770)`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770) — **Success**  
**Latest Verified PR Run (`PR #57`):** [`Run #73 (44247935450)`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44247935450) — **Success**

---

## 1. Workflow Upgrades Landed in Week 11

In Week 11 ([`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)), `.github/workflows/ci.yml` was updated so every push to `main` and every pull request runs **frontend unit tests in CI** alongside TypeScript, ESLint, surface isolation, production Next.js build, and PostgreSQL 16 `FORCE RLS` backend verification:

```yaml
      - name: TypeScript Check
        run: |
          npm --prefix frontend run typecheck

      - name: Frontend Unit Tests (Vitest)
        run: |
          npm --prefix frontend test

      - name: Next.js Build
        run: |
          npm --prefix frontend run build
```

Additionally, migration [`0013_drop_legacy_rls_policies.py`](../../backend/stores/migrations/0013_drop_legacy_rls_policies.py) (commit [`64a31f9`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/64a31f9)) now runs inside CI's `Run Migrations` step against `postgres:16-alpine` and asserts that every tenant table retains strictly `['tenant_isolation_policy']` with zero leftover `app.bypass_rls` policies.

---

## 2. Verified Execution Records

| Run | Trigger & Branch | Tested Commit SHA | Conclusion | Jobs & Key Verifications |
|---|---|---|---|---|
| **[Run #74 (`44248144770`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770)** | `push` to `main` (`PR #57` merge) | `80984261d9ab698a27e8c8affa34766083af1ec0` | **success** | 1) `Backend (Django + Postgres FORCE RLS)` — `success` (non-superuser `NOBYPASSRLS` role provisioned, `manage.py check`, `makemigrations --check`, `migrate` incl. `0013`, `154` backend tests pass with `0` skipped)<br>2) `Frontend (Next.js)` — `success` (`check:surfaces`, ESLint, `tsc --noEmit`, `npm test` `73/73`, `next build`) |
| **[Run #73 (`44247935450`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44247935450)** | `pull_request` ([#57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)) | `aa62b2f67d18247f3c3ff204991fba4a19d26aaa` | **success** | Both `Backend (Django + Postgres FORCE RLS)` and `Frontend (Next.js)` passed pre-merge |
| **[Run #72 (`43901812759`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43901812759)** | `push` to `main` | `02f5779` | **success** | Docs reconciliation after PR #54 merge |
| **[Run #71 (`43899189860`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43899189860)** | `push` to `main` (`PR #54` merge) | `6559ea2` | **success** | Post-PR #54 Khalti sandbox merge validation |

---

## 3. Exact Job Step Breakdown (`Run #74 — 44248144770`)

### Job 1: `Backend (Django + Postgres FORCE RLS)` — `success`
- Provision Non-Superuser `NOBYPASSRLS` Postgres Test Role (`postgres:16-alpine`) — `success`
- Set up Python 3.13 & Install dependencies — `success`
- Django System Check (`manage.py check`) — `success`
- Verify Pending Migrations (`makemigrations --check --dry-run`) — `success`
- Collect Static Files (WhiteNoise Manifest) — `success`
- Run Migrations (`manage.py migrate --noinput` including `stores.0013_drop_legacy_rls_policies`) — `success`
- Run Full PostgreSQL RLS Test Suite (`NOSUPERUSER NOBYPASSRLS`) — `success`

### Job 2: `Frontend (Next.js)` — `success`
- Set up Node.js 22 & `npm ci` — `success`
- Surface Boundary Check (`check-surfaces.mjs`) — `success`
- ESLint (`src/app/(platform)`, `merchant`, `s`, `components/{account,auth,storefront}`, `lib`) — `success`
- TypeScript Check (`tsc --noEmit`) — `success`
- Frontend Unit Tests (Vitest — `npm --prefix frontend test`) — `success`
- Next.js Build (`npm --prefix frontend run build`) — `success`

---

## 4. What CI Does NOT Establish (Negative Boundaries)

- Passing `Backend (Django + Postgres FORCE RLS)` tests under mocked `requests.post()` does not guarantee live third-party Khalti Sandbox server reachability on demo day (mitigated by COD fallback).
- Running Next.js build & Vitest unit tests in CI does not test physical mobile browsers (iOS Safari virtual keyboard behavior stays verified separately in Sprint 3 under Issue `#52`).
- CI does not validate live production environment variables on Render/Vercel (live `https://shopcraft.me` browser observations are documented separately in [`mvp-freeze-record.md`](mvp-freeze-record.md) and [`tested-by-note.md`](tested-by-note.md)).
