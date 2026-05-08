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
