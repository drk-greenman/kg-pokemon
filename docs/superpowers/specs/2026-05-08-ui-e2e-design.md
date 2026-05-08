# UI E2E Test Design

**Date:** 2026-05-08  
**Scope:** Playwright end-to-end tests for the Pokemon Team Builder frontend (`packages/pokemon-ui-e2e`)

---

## Overview

Replace the placeholder `example.spec.ts` with two spec files — one per page — covering the full user-facing functionality of the app. Tests run against a live full stack (Vite dev server + Spring Boot backend + Postgres) across all three configured browsers (Chromium, Firefox, WebKit).

---

## Infrastructure

### Database isolation

A `globalSetup` hook runs once before the entire Playwright run. It connects directly to Postgres (`localhost:5432`, database `pokemon`, credentials `admin/admin`) using the `pg` client and runs `TRUNCATE profile_pokemon, profile RESTART IDENTITY CASCADE`. This exactly matches the pattern used by the backend E2E global setup.

A `globalTeardown` hook performs the same truncation after the run for cleanliness.

**New files:**
- `packages/pokemon-ui-e2e/src/support/global-setup.ts`
- `packages/pokemon-ui-e2e/src/support/global-teardown.ts`

### `playwright.config.ts` changes

Add `globalSetup` and `globalTeardown` fields pointing at the two support files above. All other config (three browsers, `baseURL: http://localhost:4200`, `webServer: nx serve pokemon-ui`) remains unchanged. The backend is assumed to be running separately before the test run.

---

## Spec files

### `src/profile-list.spec.ts`

No additional `beforeAll` — the global truncation provides a clean slate. Tests accumulate state within the file (each test may rely on state left by previous tests).

| # | Test case |
|---|-----------|
| 1 | App bar shows "Pokémon Team Builder" |
| 2 | Shows "+ New Profile" button when list is empty; no profile rows visible |
| 3 | Clicking "+ New Profile" opens the dialog with a "Profile name" field |
| 4 | Create button is disabled when name field is blank; enabled after typing |
| 5 | Creating a profile closes the dialog and adds the profile to the list |
| 6 | Creating a second profile adds it to the already-populated list; both appear |
| 7 | Clicking a profile row navigates to `/profiles/:id` |

### `src/team-builder.spec.ts`

A `beforeAll` creates a fresh profile via `POST /api/profiles` and stores its `id`. Tests navigate to `/profiles/:id` and accumulate state within the file.

| # | Test case |
|---|-----------|
| 1 | App bar shows the profile's name |
| 2 | Pokemon grid loads all 150 Pokemon cards |
| 3 | Selecting a Pokemon adds it to the team row (slot fills with sprite) |
| 4 | Selecting a second Pokemon fills a second slot |
| 5 | Adding the same Pokemon twice fills two slots and shows a ×2 badge on its card |
| 6 | Clicking a filled slot in the team row removes that Pokemon (slot becomes empty) |
| 7 | Selecting 6 Pokemon causes grid cards to become visually disabled (opacity reduced) |
| 8 | Clicking a card when at cap does not add a 7th Pokemon to the team row |
| 9 | Saving a partial team (fewer than 6) navigates back to `/` |
| 10 | Navigating back to the profile shows the saved partial team |
| 11 | Saving a full team (6 Pokemon) navigates back to `/` |
| 12 | Navigating back to the profile shows the saved full team |

---

## Assumptions and constraints

- The backend and Postgres must be running before `nx e2e pokemon-ui-e2e` is invoked (same assumption as `nx e2e pokemon-user-backend-e2e`).
- Tests do not mock the network — all API calls go to the live backend at `localhost:3000/api`.
- The `pg` package is already available as a dev dependency (used by the backend E2E tests); no new packages are needed.
- Pokemon sprites are loaded from an external CDN (`raw.githubusercontent.com`). Tests that interact with sprites (team row, badges) use `alt` attributes or slot position rather than image src matching.
- Playwright parallelism is left at its default. Because the global truncation runs once and tests within each file accumulate state, parallel workers must not run tests from the same file concurrently. Playwright's default (one file per worker) satisfies this without extra config.
