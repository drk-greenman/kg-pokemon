# Package Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained README to each active package, update the root README and setup script to reflect the Java backend, and generate a Maven wrapper to eliminate Maven as a local prerequisite.

**Architecture:** Flat per-package READMEs — each package directory gets its own `README.md` covering purpose, run commands, architecture, API (where applicable), testing, and env vars. No shared doc hub. The Maven wrapper is generated once and wired into `project.json` so all `nx` commands use it automatically.

**Tech Stack:** Spring Boot 3.5 / Maven 3.9.9 / Java 25, React 19 / Vite, Playwright, Jest, Nx 22, pnpm workspace monorepo.

---

## File Map

| Action | File |
|---|---|
| Generate | `packages/pokemon-user-backend-java/mvnw` |
| Generate | `packages/pokemon-user-backend-java/mvnw.cmd` |
| Generate | `packages/pokemon-user-backend-java/.mvn/wrapper/maven-wrapper.properties` |
| Modify | `packages/pokemon-user-backend-java/project.json` |
| Modify | `scripts/setup.sh` |
| Modify | `README.md` |
| Create | `packages/pokemon-user-backend-java/README.md` |
| Create | `packages/pokemon-ui/README.md` |
| Create | `packages/pokemon-user-backend-e2e/README.md` |
| Create | `packages/pokemon-ui-e2e/README.md` |

---

## Task 1: Generate Maven wrapper and wire it into project.json

**Files:**
- Generate: `packages/pokemon-user-backend-java/mvnw`
- Generate: `packages/pokemon-user-backend-java/mvnw.cmd`
- Generate: `packages/pokemon-user-backend-java/.mvn/wrapper/maven-wrapper.properties`
- Modify: `packages/pokemon-user-backend-java/project.json`

- [ ] **Step 1: Generate the Maven wrapper**

```bash
cd packages/pokemon-user-backend-java
mvn wrapper:wrapper -Dmaven=3.9.9
```

Expected output: `[INFO] BUILD SUCCESS`. This creates `mvnw`, `mvnw.cmd`, and `.mvn/wrapper/maven-wrapper.properties`.

- [ ] **Step 2: Make mvnw executable**

```bash
chmod +x packages/pokemon-user-backend-java/mvnw
```

- [ ] **Step 3: Verify the wrapper works**

```bash
cd packages/pokemon-user-backend-java
./mvnw --version
```

Expected: output showing `Apache Maven 3.9.9` and `Java version: 25`.

- [ ] **Step 4: Update project.json to use ./mvnw**

Replace every `mvn` with `./mvnw` in `packages/pokemon-user-backend-java/project.json`:

```json
{
  "name": "pokemon-user-backend-java",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/pokemon-user-backend-java/src",
  "projectType": "application",
  "tags": [],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./mvnw package -q -DskipTests",
        "cwd": "packages/pokemon-user-backend-java"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./mvnw test",
        "cwd": "packages/pokemon-user-backend-java"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./mvnw spring-boot:run",
        "cwd": "packages/pokemon-user-backend-java"
      }
    }
  }
}
```

- [ ] **Step 5: Verify nx build still works**

```bash
nx build pokemon-user-backend-java
```

Expected: `BUILD SUCCESS` and a jar file in `packages/pokemon-user-backend-java/target/`.

- [ ] **Step 6: Commit**

```bash
git add packages/pokemon-user-backend-java/mvnw packages/pokemon-user-backend-java/mvnw.cmd packages/pokemon-user-backend-java/.mvn packages/pokemon-user-backend-java/project.json
git commit -m "chore(java-backend): add Maven wrapper, switch project.json to ./mvnw"
```

---

## Task 2: Add Java 25 check to setup script

**Files:**
- Modify: `scripts/setup.sh`

- [ ] **Step 1: Add Java section after the Tilt section**

In `scripts/setup.sh`, find the closing `fi` of the Tilt section (section 4) and insert a new section 5 immediately after it, before the "Bail if prerequisites are missing" block. Renumber "Installing dependencies" from 5 to 6.

The new section to insert:

```bash
# ─────────────────────────────────────────────
# 5. Java 25
# ─────────────────────────────────────────────
header "5. Java 25"

if ! command -v java &>/dev/null; then
  fail "Java not found. Java 25 JDK is required to run backend commands locally."
  fail "  macOS:  brew install --cask temurin@25"
  fail "  Other:  https://adoptium.net/"
  ERRORS=$((ERRORS + 1))
else
  JAVA_MAJOR=$(java --version 2>/dev/null | head -1 | awk '{print $2}' | cut -d. -f1)
  if [ -z "$JAVA_MAJOR" ] || ! [ "$JAVA_MAJOR" -ge 25 ] 2>/dev/null; then
    fail "Java 25+ required (found version: $JAVA_MAJOR). Install:"
    fail "  macOS:  brew install --cask temurin@25"
    fail "  Other:  https://adoptium.net/"
    ERRORS=$((ERRORS + 1))
  else
    ok "Java $JAVA_MAJOR"
  fi
fi
```

Also update the "Installing dependencies" header line from:

```bash
header "5. Installing dependencies"
```

to:

```bash
header "6. Installing dependencies"
```

- [ ] **Step 2: Verify the script runs cleanly on this machine**

```bash
bash scripts/setup.sh
```

Expected: all sections including `✔  Java 25` pass, script exits 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/setup.sh
git commit -m "chore(setup): add Java 25 prerequisite check"
```

---

## Task 3: Update root README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the Tech Stack list**

Find:
```markdown
- Node/NestJS Backend
```

Replace with:
```markdown
- Java 25 / Spring Boot 3.5 Backend
```

- [ ] **Step 2: Add Java 25 to Prerequisites**

Find the Prerequisites section:
```markdown
## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes enabled
- [Tilt](https://docs.tilt.dev/install.html) (`brew install tilt` on macOS)
```

Replace with:
```markdown
## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes enabled
- [Tilt](https://docs.tilt.dev/install.html) (`brew install tilt` on macOS)
- [Java 25 JDK](https://adoptium.net/) (`brew install --cask temurin@25` on macOS)
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): update tech stack and prerequisites for Java backend"
```

---

## Task 4: Create packages/pokemon-user-backend-java/README.md

**Files:**
- Create: `packages/pokemon-user-backend-java/README.md`

- [ ] **Step 1: Create the README**

Create `packages/pokemon-user-backend-java/README.md` with this content:

````markdown
# pokemon-user-backend-java

Spring Boot 3.5 REST API for the Pokémon Team Builder. Manages Pokémon, profiles, and team assignments backed by PostgreSQL. Runs on port 3000 under the `/api` prefix. Flyway migrations run automatically on startup.

## Running

**Via Tilt (recommended — no local Java or Maven needed):**

```bash
tilt up
```

**Locally (requires Java 25):**

```bash
nx serve pokemon-user-backend-java
```

The server starts at `http://localhost:3000/api`.

## Building

```bash
nx build pokemon-user-backend-java
```

Produces a jar in `target/`. Uses the Maven wrapper (`./mvnw`) — no local Maven installation required.

## Testing

```bash
nx test pokemon-user-backend-java
```

Runs Maven Surefire unit tests.

## Architecture

```
src/main/java/com/pokemon/userbackend/
├── controller/       # HTTP layer — PokemonController, ProfileController
├── service/          # Business logic — PokemonService, ProfileService
├── repository/       # Spring Data JPA repos
├── entity/           # JPA entities — Pokemon, Profile, ProfilePokemon
├── dto/              # Request/response shapes
├── mapper/           # Entity ↔ DTO conversion
└── exception/        # GlobalExceptionHandler, domain exceptions
```

Flyway migrations live in `src/main/resources/db/migration/`:
- `V1__create_pokemon.sql`
- `V2__create_profile.sql`
- `V3__create_profile_pokemon.sql`
- `V4__seed_pokemon.sql` — seeds all 150 Pokémon by Pokédex number

## API Reference

All routes are prefixed with `/api`.

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| `GET` | `/api/pokemon` | — | `[{ id, name }]` |
| `GET` | `/api/profiles` | — | `[{ id, name }]` |
| `POST` | `/api/profiles` | `{ "name": "Ash" }` | `{ id, name }` |
| `GET` | `/api/profiles/{id}` | — | `{ id, name, pokemon: [{ id, name }] }` |
| `PUT` | `/api/profiles/{id}/team` | `{ "pokemonIds": [1, 4, 7] }` | `{ id, name, pokemon: [{ id, name }] }` |

`PUT /api/profiles/{id}/team` replaces the team atomically. Maximum 6 Pokémon per team.

## Environment Variables

All default to the values used by the dev Postgres container (`tilt up`).

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `pokemon` | Database name |
| `DB_USERNAME` | `admin` | Database user |
| `DB_PASSWORD` | `admin` | Database password |
````

- [ ] **Step 2: Commit**

```bash
git add packages/pokemon-user-backend-java/README.md
git commit -m "docs(java-backend): add README"
```

---

## Task 5: Create packages/pokemon-ui/README.md

**Files:**
- Create: `packages/pokemon-ui/README.md`

- [ ] **Step 1: Create the README**

Create `packages/pokemon-ui/README.md` with this content:

````markdown
# pokemon-ui

React 19 SPA for the Pokémon Team Builder. Provides two views: a profile list and a team builder. Communicates with the backend exclusively through `/api` (relative URL).

## Running

```bash
nx serve pokemon-ui
```

Opens at `http://localhost:4200`. The backend must be running for API calls to succeed.

In dev, Vite proxies all `/api` requests to `http://localhost:3000`. In Tilt, routing is handled by Kubernetes ingress — no proxy configuration needed.

## Building

```bash
nx build pokemon-ui
```

Output goes to `dist/`.

## Testing

```bash
nx test pokemon-ui
```

Runs Vitest unit tests with React Testing Library.

## Architecture

```
src/
├── api/              # Axios client, typed request functions
├── components/       # Shared UI components
├── pages/
│   ├── ProfileListPage.tsx   # Route: /
│   └── TeamBuilderPage.tsx   # Route: /profiles/:id
└── main.tsx          # App entry — BrowserRouter + routes
```

**Routing:** React Router v7. Two routes:
- `/` — `ProfileListPage`: lists profiles, opens a dialog to create new ones
- `/profiles/:id` — `TeamBuilderPage`: browse all 150 Pokémon, toggle selections, save team

**Styling:** Emotion CSS + MUI component library throughout. No plain CSS files.

**Data fetching:** Each page manages its own fetch state. No global state manager.

## Environment Variables

None. The backend URL is hardcoded as `/api` (relative), resolved via Vite proxy in dev.
````

- [ ] **Step 2: Commit**

```bash
git add packages/pokemon-ui/README.md
git commit -m "docs(pokemon-ui): add README"
```

---

## Task 6: Create packages/pokemon-user-backend-e2e/README.md

**Files:**
- Create: `packages/pokemon-user-backend-e2e/README.md`

- [ ] **Step 1: Create the README**

Create `packages/pokemon-user-backend-e2e/README.md` with this content:

````markdown
# pokemon-user-backend-e2e

Jest integration tests that exercise all backend API endpoints over HTTP against a live Java backend and PostgreSQL database.

## Running

```bash
nx e2e pokemon-user-backend-e2e
```

**Prerequisites:** The Java backend and Postgres must be running before executing these tests. Start them with:

```bash
tilt up
# or
nx serve pokemon-user-backend-java  # (Postgres must already be running)
```

## Architecture

```
src/
├── pokemon-user-backend/
│   ├── pokemon.spec.ts    # Tests for GET /api/pokemon
│   └── profiles.spec.ts   # Tests for profile and team endpoints
└── support/
    ├── global-setup.ts    # DB connection check before suite
    ├── global-teardown.ts # DB cleanup after suite
    ├── test-setup.ts      # Per-test DB truncation
    └── global.d.ts        # TypeScript declarations for global teardown
```

Tests are grouped by resource. `globalSetup` verifies the database is reachable before the suite starts. `globalTeardown` cleans up after. Per-test setup in `test-setup.ts` truncates relevant tables so each test starts with a clean slate.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3000/api` | Base URL of the running backend |
````

- [ ] **Step 2: Commit**

```bash
git add packages/pokemon-user-backend-e2e/README.md
git commit -m "docs(backend-e2e): add README"
```

---

## Task 7: Create packages/pokemon-ui-e2e/README.md

**Files:**
- Create: `packages/pokemon-ui-e2e/README.md`

- [ ] **Step 1: Create the README**

Create `packages/pokemon-ui-e2e/README.md` with this content:

````markdown
# pokemon-ui-e2e

Playwright end-to-end tests for the Pokémon Team Builder UI. Covers the full user flow — creating a profile, selecting Pokémon, and saving a team — across Chromium, Firefox, and WebKit.

## Running

```bash
nx e2e pokemon-ui-e2e
```

**Prerequisites:** The full stack must be running before executing these tests:

```bash
tilt up
# or both of:
nx serve pokemon-user-backend-java
nx serve pokemon-ui
```

## Architecture

```
src/
├── profile-list.spec.ts   # Tests for the profile list page (/)
├── team-builder.spec.ts   # Tests for the team builder page (/profiles/:id)
└── support/
    ├── global-setup.ts    # DB truncation before the suite
    └── global-teardown.ts # Cleanup after the suite
```

**Workers:** Tests run with `workers: 1` (sequential). This prevents race conditions across browsers sharing the same database.

**DB isolation:** `global-setup.ts` truncates relevant tables before the suite runs. Each browser effectively starts with a clean database state, which is why sequential execution is required rather than parallel.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:4200` | URL of the running frontend |
````

- [ ] **Step 2: Commit**

```bash
git add packages/pokemon-ui-e2e/README.md
git commit -m "docs(ui-e2e): add README"
```
