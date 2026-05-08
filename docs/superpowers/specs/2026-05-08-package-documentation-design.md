# Package Documentation Design

**Date:** 2026-05-08
**Scope:** All active packages in the monorepo + root README + setup script

---

## Goal

Each active package gets a self-contained `README.md` covering purpose, run commands, architecture, API (where applicable), testing, and env vars. The root `README.md` and `scripts/setup.sh` are updated to reflect the Java backend that replaced the original NestJS backend.

The old NestJS backend (`packages/pokemon-user-backend`) has already been deleted in this session, along with its dead dependencies from `package.json`.

---

## Active Packages

| Package | Type |
|---|---|
| `pokemon-user-backend-java` | Spring Boot REST API |
| `pokemon-ui` | React SPA |
| `pokemon-user-backend-e2e` | Jest API integration tests |
| `pokemon-ui-e2e` | Playwright UI tests |

---

## Maven Wrapper

Before writing any READMEs, generate a Maven wrapper in `packages/pokemon-user-backend-java`:

```bash
cd packages/pokemon-user-backend-java
mvn wrapper:wrapper
```

This produces `mvnw`, `mvnw.cmd`, and `.mvn/wrapper/maven-wrapper.properties`. Update `project.json` to replace `mvn` with `./mvnw` in all three targets (build, test, serve). Commit the generated files.

**Why:** Eliminates Maven as a local prerequisite. Users only need Java 25 — the wrapper downloads the correct Maven version automatically.

---

## `scripts/setup.sh` Changes

Add a new **Java** section (after section 4 — Tilt, before the bail-on-errors block) that:

- Checks `java -version` output for a major version ≥ 25
- On failure: prints install instructions for macOS (`brew install --cask temurin@25`) and a link to https://adoptium.net for other platforms
- On success: prints the detected version with `ok`

No Maven check needed — the wrapper handles it.

---

## Root `README.md` Changes

1. **Tech Stack list:** Replace `Node/NestJS Backend` with `Java 25 / Spring Boot 3.5 Backend`
2. **Prerequisites list:** Add `Java 25 (JDK)` with install hint (`brew install --cask temurin@25`)

No other content changes — the interview prompt text stays intact.

---

## Per-Package READMEs

All `nx` commands use the shorthand form (`nx serve <project>`, not `nx run <project>:<target>`), consistent with CLAUDE.md.

### `packages/pokemon-user-backend-java/README.md`

**Sections:**
- **What it does:** Spring Boot 3.5 REST API. Manages Pokémon, profiles, and team assignments. Runs on port 3000 under the `/api` prefix. Flyway migrations run automatically on startup.
- **Running:** `nx serve pokemon-user-backend-java` (local, requires Java 25) or `tilt up` (Docker-based, no local Java/Maven needed).
- **Building:** `nx build pokemon-user-backend-java`
- **Architecture:** Package structure — controllers → services → repositories → entities. Flyway migrations in `src/main/resources/db/migration`.
- **API Reference:** Table of all 5 endpoints:
  - `GET /api/pokemon` → `[{ id, name }]`
  - `GET /api/profiles` → `[{ id, name }]`
  - `POST /api/profiles` body `{ name }` → `{ id, name }`
  - `GET /api/profiles/{id}` → `{ id, name, pokemon: [{ id, name }] }`
  - `PUT /api/profiles/{id}/team` body `{ pokemonIds: [1,4,7] }` → `{ id, name, pokemon: [{ id, name }] }`
- **Testing:** `nx test pokemon-user-backend-java` (Maven Surefire unit tests)
- **Environment variables** (all have defaults matching the dev Postgres container):
  - `DB_HOST` (default: `localhost`)
  - `DB_PORT` (default: `5432`)
  - `DB_NAME` (default: `pokemon`)
  - `DB_USERNAME` (default: `admin`)
  - `DB_PASSWORD` (default: `admin`)

---

### `packages/pokemon-ui/README.md`

**Sections:**
- **What it does:** React 19 SPA. Two routes: profile list (`/`) and team builder (`/profiles/:id`). Fetches from the backend via `/api` (proxied by Vite in dev).
- **Running:** `nx serve pokemon-ui` → `http://localhost:4200`. Requires the backend to be running for API calls.
- **Building:** `nx build pokemon-ui`
- **Architecture:** Component tree — `App → BrowserRouter → ProfileListPage / TeamBuilderPage`. Vite proxies `/api` to `http://localhost:3000` in dev; in Tilt, routing is handled by Kubernetes ingress.
- **Testing:** `nx test pokemon-ui` (Vitest + React Testing Library)
- **Environment variables:** None. Backend URL is hardcoded as `/api` (relative), resolved via Vite proxy in dev.

---

### `packages/pokemon-user-backend-e2e/README.md`

**Sections:**
- **What it does:** Jest integration tests that exercise all 5 API endpoints over HTTP against a live backend and Postgres database.
- **Running:** `nx e2e pokemon-user-backend-e2e`. Requires the Java backend and Postgres to be running first (e.g. via `tilt up`).
- **Architecture:** `src/` contains test files grouped by resource. `globalSetup`/`globalTeardown` hooks handle DB cleanup between runs.
- **Environment variables:**
  - `API_BASE_URL` (default: `http://localhost:3000/api`)

---

### `packages/pokemon-ui-e2e/README.md`

**Sections:**
- **What it does:** Playwright E2E tests across Chromium, Firefox, and WebKit. Covers the full user flow — creating a profile, selecting Pokémon, saving a team.
- **Running:** `nx e2e pokemon-ui-e2e`. Requires the full stack to be running (`tilt up` or both `nx serve` commands).
- **Architecture:** `src/` contains page object models and spec files. `playwright.config.ts` sets `workers: 1` (sequential execution) and performs per-browser DB truncation to prevent state contamination across browsers.
- **Environment variables:**
  - `BASE_URL` (default: `http://localhost:4200`)
