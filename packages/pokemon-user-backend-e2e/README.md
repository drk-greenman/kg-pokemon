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
