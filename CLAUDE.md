# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **Pokemon Team Builder** app — users view the first 150 Pokemon, select up to 6 for a team, and save teams to profiles in a PostgreSQL database. This is an interview project mirroring a production tech stack.

## Development Environment

Requires Docker Desktop with Kubernetes enabled, Tilt, and pnpm 10.33.2.

```bash
bash scripts/setup.sh  # First-time setup: validates prereqs and installs deps
tilt up                # Start all services (PostgreSQL, backend, frontend)
tilt down              # Tear down
```

Service ports: frontend `localhost:4200`, backend `localhost:3000/api`, PostgreSQL `localhost:5432`.

## Commands

```bash
# Serve
nx run pokemon-ui:serve                    # Frontend dev server
nx run pokemon-user-backend-java:serve     # Backend dev server (Spring Boot)

# Build
nx build pokemon-ui
nx build pokemon-user-backend-java

# Lint
nx lint pokemon-ui

# Test (unit)
nx test pokemon-ui                         # Vitest
nx test pokemon-user-backend-java          # Maven Surefire (./mvnw test)

# Test (E2E)
nx e2e pokemon-user-backend-e2e           # Jest against live API
nx e2e pokemon-ui-e2e                     # Playwright (chromium, firefox, webkit)
```

Nx does not support running a single test file directly — use Vitest's `--reporter` and `--testPathPattern` flags via `nx test pokemon-ui -- --testNamePattern="pattern"` if filtering is needed. For Java tests, use `-Dtest=ClassName#methodName` with the Maven wrapper directly.

## Architecture

pnpm workspace monorepo managed by Nx 22, with four packages under `packages/`:

| Package | Role | Key Tech |
|---|---|---|
| `pokemon-ui` | React SPA | React 19, Vite, Emotion CSS, Vitest |
| `pokemon-user-backend-java` | REST API | Spring Boot 3.5, Spring Data JPA, Flyway, Java 25 |
| `pokemon-ui-e2e` | Frontend E2E | Playwright |
| `pokemon-user-backend-e2e` | Backend E2E | Jest + ts-jest |

**Backend** is a Spring Boot 3.5 app (Java 25, Maven wrapper). It serves under the `/api` context path (`server.servlet.context-path=/api`) on port 3000. Spring Data JPA handles persistence; Flyway migrations live in `packages/pokemon-user-backend-java/src/main/resources/db/migration/` and are applied automatically on startup. Nx targets delegate to `./mvnw` commands.

**Frontend** is built with Vite (SSR mode is used for the *backend* build, not the frontend). Module aliases are resolved via the `nxViteTsPaths` plugin — Nx path mappings in `tsconfig.base.json` apply to all packages.

**Build system**: Nx plugins (`@nx/vite`, `@nx/eslint`, `@nx/playwright`) infer targets from config files rather than explicit `project.json` entries for the JS packages. The Java backend uses an explicit `project.json` with `nx:run-commands` executors. ESLint uses flat config (`eslint.config.mjs`) and enforces `@nx/enforce-module-boundaries` (JS/TS packages only).

**Database** (dev): host `localhost:5432`, database `pokemon`, credentials `admin/admin`.

## Code Style

**Frontend (pokemon-ui):**
- Prettier: `singleQuote: true`
- TypeScript: strict mode, ES2022 target, `bundler` module resolution
- Emotion CSS for all frontend styling (no plain CSS files)

**Backend (pokemon-user-backend-java):**
- Java 25, standard Spring Boot conventions
- Flyway SQL migrations follow the `V{n}__{description}.sql` naming convention

## LLM Transcript Requirement

This is an interview project. **At the end of every conversation, append the full session to `LLM_TRANSCRIPT.md`** in the repo root using this format:

```
---

## Session — YYYY-MM-DD

**Tool:** Claude Code  
**Model:** claude-sonnet-4-6

### Conversation

**User:** <exact prompt>

**Claude:** <full response, including any tool calls and their results>

...repeat for every turn in the session...
```

Rules:
- Include every turn — user prompts and Claude's full responses.
- Include tool calls and their output inline where they occurred.
- Append; do not overwrite existing entries.
- If `LLM_TRANSCRIPT.md` does not exist, create it with a top-level heading `# LLM Transcript` before the first entry.
- After writing, remind the user to commit the file.
