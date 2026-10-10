# Review of the Lovable UI (ATS-1)

Reviewed on 8 October 2026 against `docs/ui-spec.md`. Commit `950a986` of the Lovable repo.

**Method:** I read every non-generated file in `src/`, clicked through the preview, and in a scratch copy I installed the dependencies and ran type check, lint, tests and three production builds. Nothing on a real phone or on Vercel has been tested yet.

## Summary

The UI follows the spec closely and the code is well structured. Before epic 1 can start, four things block a clean handover, and there are a handful of small UI fixes. All of them go into ATS-2.

## What the spec asked for, and what was built

| Spec | Result |
|---|---|
| Types in `src/types/index.ts`, including `stage_changed_at` | Done |
| Data functions in `src/lib/api/`, one file per entity, `customerId` as an argument | Done |
| Mock store only imported from `src/lib/api/` | Done (checked with grep) |
| About 300 ms delay on every mock call | Done |
| Query keys include the active customer id | Done, with a test. Switching customer in the preview showed skeletons, not the previous customer's cards |
| Optimistic card move with rollback and toast | Done |
| `AuthContext` with `useAuth()`, `RequireAuth`, `RequireAdmin` | Done. A customer opening `/admin/accounts` is redirected to `/pipeline` |
| Demo login isolated in `DemoLogin.tsx` | Done |
| Logout clears the query cache | Done |
| `ActiveCustomerContext`, picker, banner, "Välj en kund att arbeta som" | Done |
| Pipeline filters in the URL as `?job=&q=` | Done, validated with zod |
| Loading, empty and error states | Done on every page |
| Pointer and touch drag | Both sensors configured. Not tested on a phone |
| No Supabase, no Lovable Cloud | No Supabase files or references in the repo. The Cloud setting in Lovable still needs a manual check |

## Checks that were run

| Check | Result |
|---|---|
| `tsc --noEmit` (strict) | Passes |
| `npm test` | 4 of 4 tests pass (query keys, days in stage, LinkedIn URL, routing) |
| `npm run lint` | **Fails:** 152 Prettier errors, all fixable with `--fix`, plus 8 warnings |
| `npm run build` | Passes. Default target is Cloudflare Workers |
| Build with `VERCEL=1` | Passes and produces `.vercel/output`, so Vercel should be detected automatically |
| Build with the Node preset, then requesting each route | `/` redirects to `/pipeline`. `/login`, `/pipeline` and `/admin/accounts` return 200. An unknown path returns 404 |

## Differences from the spec

**The stack is TanStack Start, not a plain Vite SPA.** Lovable used its TanStack Start template, so the app runs with server-side rendering through Nitro, and routing is TanStack Router with files in `src/routes/` instead of React Router. Auth and data load in the browser, so the server only renders the page shell. This works with Supabase's browser client. Recommendation: keep it. Converting to a plain SPA costs time and gives nothing for this test. One consequence: `vercel.json` with an SPA rewrite would be wrong here and must not be added.

## Blocking for the handover (ATS-2)

1. **`bun.lock` points at Lovable's private package cache.** The `@dnd-kit` packages resolve to `europe-west4-npm.pkg.dev/lovable-core-prod/...`, which returns 403 for anyone outside Lovable. `bun install` fails for me, CI and Vercel. Fix: remove `bun.lock` and `bunfig.toml` and use npm with `package-lock.json`.
2. **`npm install` crashes** with `Cannot read properties of null (reading 'edgesOut')`, a peer resolution bug in npm 10. It works with `legacy-peer-deps`. Fix: add `.npmrc` with `legacy-peer-deps=true`. Verified that `npm ci` then installs cleanly and the tests pass.
3. **Lint fails.** 152 formatting errors would fail CI. Fix: one commit with `npx eslint . --fix` and nothing else. Also add `.vercel` and `.wrangler` to the ESLint ignores, because otherwise a local build makes lint very slow.
4. **The LinkedIn check in the UI is looser than the database.** The UI accepts `https://linkedin.com` (no path) and nested subdomains. The database check `^https?://([a-z]+\.)?linkedin\.com/` rejects both, so saving such a candidate would fail in epic 2. Fix: use the same rule in `isLinkedInUrl` and add tests for both cases.

## Small UI fixes (ATS-2)

5. The sidebar footer says "Prototyp med låtsasdata. Inget sparas." It was copied from the prototype. Remove it.
6. Customers see no company name in the header. Show it where admins see the customer picker.
7. When an admin switches customer, `?job=` keeps the previous customer's job id, so the board shows "Inga kort matchar filtret". Clear the job filter on customer switch.
8. `package.json` is named `tanstack_start_ts`. Rename it to `mini-ats`.

## Decisions for Patrik

9. **Editing a candidate and unchecking a job deletes that card.** With Supabase this would also delete its AI assessments. Recommendation: in edit mode, only allow adding jobs. Removing a candidate from a job is out of scope.
10. **Lovable leftovers.** `AGENTS.md`, `.lovable/project.json`, `src/lib/lovable-error-reporting.ts` (does nothing outside the Lovable editor) and the build wrapper `@lovable.dev/vite-tanstack-config`. Recommendation: leave them. They are harmless, and removing the build wrapper means rewriting the Vite config. Mention it in the README.

## Needs a manual test

- Drag on a real phone. Both a pointer sensor and a touch sensor are active, and a pointer sensor can start a drag when you try to scroll the board sideways. If that happens, replace `PointerSensor` with `MouseSensor`.
- The first Vercel deploy, including reloading `/pipeline` directly.
