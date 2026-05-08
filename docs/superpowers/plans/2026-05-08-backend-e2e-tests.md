# Backend E2E Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the `pokemon-user-backend-e2e` package with comprehensive e2e tests covering all five API endpoints served by the Java Spring Boot backend (`packages/pokemon-user-backend-java`).

**Architecture:** The Java backend is already fully implemented. This plan is tests-only — no backend code changes. Tests use Axios against a running server (port 3000, context path `/api`). `test-setup.ts` gains a `pg` database cleanup step to truncate profile rows before each spec file runs, ensuring isolation. All test assertions are derived from the actual Spring Boot controller/DTO/service implementations in `packages/pokemon-user-backend-java`.

**Tech Stack:** Jest, Axios, `pg` (already in root `package.json` workspace deps), TypeScript

---

## API Contract (from Java source)

| Endpoint | Success | Error cases |
|----------|---------|-------------|
| `GET /api/pokemon` | 200, array of `{id: number, name: string}`, always 150 items | — |
| `GET /api/profiles` | 200, array of `{id, name, pokemon: []}` (pokemon always empty in list) | — |
| `POST /api/profiles` | 201, `{id, name, pokemon: []}` | 400 if `name` blank/missing (`@NotBlank`) |
| `GET /api/profiles/:id` | 200, `{id, name, pokemon: [{id, name},...]}` | 404 if id unknown |
| `PUT /api/profiles/:id/team` | 200, `{id, name, pokemon: [{id, name},...]}` | 400 if `>6 ids` or `pokemonIds null`; 404 if profile or any pokemon id unknown |

**Important details from the source:**
- `ProfileDto` record always has `pokemon` field. The list endpoint (`GET /api/profiles`) returns profiles with `pokemon: []` via `ProfileMapper.toDto(Profile)`.
- `POST /api/profiles` returns `pokemon: []` (team starts empty).
- `PUT /:id/team` and `GET /:id` — do not assert order; tests use `toContain` checks on IDs only.
- `PUT /:id/team` with any unknown pokemon id returns 404, not 400.
- Table names: `pokemon`, `profile`, `profile_pokemon` (serial PK on `profile_pokemon`, not composite).

---

## File Map

| Action | Path |
|--------|------|
| Modify | `packages/pokemon-user-backend-e2e/src/support/test-setup.ts` |
| Create | `packages/pokemon-user-backend-e2e/src/pokemon-user-backend/pokemon.spec.ts` |
| Create | `packages/pokemon-user-backend-e2e/src/pokemon-user-backend/profiles.spec.ts` |
| Delete | `packages/pokemon-user-backend-e2e/src/pokemon-user-backend/pokemon-user-backend.spec.ts` |

---

## Task 1: Add Database Cleanup to test-setup.ts

**Files:**
- Modify: `packages/pokemon-user-backend-e2e/src/support/test-setup.ts`

`setupFiles` runs once before each Jest test file. Truncating profile rows here gives every spec a clean slate without coupling specs to each other. Pokemon rows are seeded by Flyway and never modified by tests — don't truncate them.

`TRUNCATE … CASCADE` removes `profile_pokemon` rows automatically (FK cascade), then resets the `profile` serial so IDs start from 1 each time.

- [ ] **Step 1: Replace test-setup.ts**

```typescript
/* eslint-disable */
import axios from 'axios';
import { Client } from 'pg';

module.exports = async function () {
  const host = process.env['HOST'] ?? 'localhost';
  const port = process.env['PORT'] ?? '3000';
  axios.defaults.baseURL = `http://${host}:${port}`;

  const client = new Client({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    user: process.env['DB_USERNAME'] ?? 'admin',
    password: process.env['DB_PASSWORD'] ?? 'admin',
    database: process.env['DB_NAME'] ?? 'pokemon',
  });
  await client.connect();
  await client.query('TRUNCATE profile_pokemon, profile RESTART IDENTITY CASCADE');
  await client.end();
};
```

---

## Task 2: Delete the Placeholder Spec

**Files:**
- Delete: `packages/pokemon-user-backend-e2e/src/pokemon-user-backend/pokemon-user-backend.spec.ts`

The placeholder tests `GET /api` expecting `{ message: 'Hello API' }` — that route doesn't exist in the Java backend.

- [ ] **Step 1: Delete the file**

```bash
rm packages/pokemon-user-backend-e2e/src/pokemon-user-backend/pokemon-user-backend.spec.ts
```

- [ ] **Step 2: Commit cleanup**

```bash
git add packages/pokemon-user-backend-e2e/src/
git commit -m "test(e2e): replace placeholder spec with db cleanup setup"
```

---

## Task 3: Write E2E Tests for GET /api/pokemon

**Files:**
- Create: `packages/pokemon-user-backend-e2e/src/pokemon-user-backend/pokemon.spec.ts`

The Java backend seeds 150 Pokemon via `V4__seed_pokemon.sql` (Flyway). Pokemon are never written by tests — no cleanup needed.

- [ ] **Step 1: Create pokemon.spec.ts**

```typescript
// packages/pokemon-user-backend-e2e/src/pokemon-user-backend/pokemon.spec.ts
import axios from 'axios';

describe('GET /api/pokemon', () => {
  it('returns 200 with exactly 150 pokemon', async () => {
    const res = await axios.get('/api/pokemon');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(150);
  });

  it('each pokemon has a numeric id and non-empty string name', async () => {
    const res = await axios.get('/api/pokemon');
    for (const p of res.data) {
      expect(typeof p.id).toBe('number');
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it('contains bulbasaur at id 1 and mewtwo at id 150', async () => {
    const res = await axios.get('/api/pokemon');
    const byId: Record<number, string> = Object.fromEntries(
      res.data.map((p: { id: number; name: string }) => [p.id, p.name])
    );
    expect(byId[1]).toBe('bulbasaur');
    expect(byId[150]).toBe('mewtwo');
  });

  it('contains pikachu at id 25', async () => {
    const res = await axios.get('/api/pokemon');
    const pikachu = res.data.find((p: { id: number }) => p.id === 25);
    expect(pikachu).toBeDefined();
    expect(pikachu.name).toBe('pikachu');
  });
});
```

- [ ] **Step 2: Run tests (backend must be running)**

```bash
nx e2e pokemon-user-backend-e2e -- --testPathPattern="pokemon.spec"
```

Expected: 4 passing.

- [ ] **Step 3: Commit**

```bash
git add packages/pokemon-user-backend-e2e/src/pokemon-user-backend/pokemon.spec.ts
git commit -m "test(e2e): add pokemon endpoint e2e tests"
```

---

## Task 4: Write E2E Tests for Profiles API

**Files:**
- Create: `packages/pokemon-user-backend-e2e/src/pokemon-user-backend/profiles.spec.ts`

Key facts about the Java backend that shape these tests:
- `ProfileDto` always includes a `pokemon` field — the list endpoint returns `pokemon: []` per profile
- `POST /api/profiles` returns `pokemon: []` (new profiles start with no team)
- Bean validation (`@NotBlank`) triggers a 400 for blank or missing `name`
- `UpdateTeamRequest` requires `@NotNull pokemonIds` — a null body field is 400
- Sending >6 pokemon IDs → 400 (`TeamSizeExceededException`)
- Unknown profile ID or unknown pokemon ID → 404 (`ResourceNotFoundException`)

- [ ] **Step 1: Create profiles.spec.ts**

```typescript
// packages/pokemon-user-backend-e2e/src/pokemon-user-backend/profiles.spec.ts
import axios from 'axios';

describe('Profiles API', () => {
  describe('GET /api/profiles', () => {
    it('returns 200 with an empty array when no profiles exist', async () => {
      const res = await axios.get('/api/profiles');
      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });

    it('lists profiles after they are created', async () => {
      await axios.post('/api/profiles', { name: 'Ash' });
      await axios.post('/api/profiles', { name: 'Misty' });
      const res = await axios.get('/api/profiles');
      const names = res.data.map((p: { name: string }) => p.name);
      expect(names).toContain('Ash');
      expect(names).toContain('Misty');
    });

    it('each profile has id, name, and an empty pokemon array', async () => {
      await axios.post('/api/profiles', { name: 'Brock' });
      const res = await axios.get('/api/profiles');
      expect(res.data.length).toBeGreaterThan(0);
      for (const p of res.data) {
        expect(typeof p.id).toBe('number');
        expect(typeof p.name).toBe('string');
        expect(p.pokemon).toEqual([]);
      }
    });
  });

  describe('POST /api/profiles', () => {
    it('creates a profile and returns 201 with id, name, and empty pokemon array', async () => {
      const res = await axios.post('/api/profiles', { name: 'Gary' });
      expect(res.status).toBe(201);
      expect(typeof res.data.id).toBe('number');
      expect(res.data.name).toBe('Gary');
      expect(res.data.pokemon).toEqual([]);
    });

    it('returns 400 when name is missing from request body', async () => {
      await expect(axios.post('/api/profiles', {})).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('returns 400 when name is blank', async () => {
      await expect(axios.post('/api/profiles', { name: '   ' })).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('returns the profile with an empty pokemon array when no team is set', async () => {
      const created = await axios.post('/api/profiles', { name: 'Leaf' });
      const res = await axios.get(`/api/profiles/${created.data.id}`);
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(created.data.id);
      expect(res.data.name).toBe('Leaf');
      expect(res.data.pokemon).toEqual([]);
    });

    it('returns the profile with populated pokemon after team is set', async () => {
      const created = await axios.post('/api/profiles', { name: 'Blue' });
      const id = created.data.id;
      await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 4, 7] });
      const res = await axios.get(`/api/profiles/${id}`);
      expect(res.status).toBe(200);
      const returnedIds = res.data.pokemon.map((p: { id: number }) => p.id);
      expect(returnedIds).toContain(1);
      expect(returnedIds).toContain(4);
      expect(returnedIds).toContain(7);
    });

    it('returns 404 for a non-existent id', async () => {
      await expect(axios.get('/api/profiles/999999')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('PUT /api/profiles/:id/team', () => {
    it('sets the team and returns 200 with the profile and pokemon', async () => {
      const created = await axios.post('/api/profiles', { name: 'Red' });
      const id = created.data.id;
      const res = await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 4, 7] });
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(id);
      expect(res.data.name).toBe('Red');
      const returnedIds = res.data.pokemon.map((p: { id: number }) => p.id);
      expect(returnedIds).toHaveLength(3);
      expect(returnedIds).toContain(1);
      expect(returnedIds).toContain(4);
      expect(returnedIds).toContain(7);
    });

    it('each pokemon in the returned team has id and name', async () => {
      const created = await axios.post('/api/profiles', { name: 'Kris' });
      const res = await axios.put(`/api/profiles/${created.data.id}/team`, { pokemonIds: [25] });
      expect(res.data.pokemon).toHaveLength(1);
      expect(res.data.pokemon[0].id).toBe(25);
      expect(res.data.pokemon[0].name).toBe('pikachu');
    });

    it('replaces the team on a second PUT', async () => {
      const created = await axios.post('/api/profiles', { name: 'Silver' });
      const id = created.data.id;
      await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 2, 3] });
      const res = await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [4, 5] });
      expect(res.data.pokemon).toHaveLength(2);
      const returnedIds = res.data.pokemon.map((p: { id: number }) => p.id);
      expect(returnedIds).not.toContain(1);
      expect(returnedIds).toContain(4);
      expect(returnedIds).toContain(5);
    });

    it('allows setting an empty team', async () => {
      const created = await axios.post('/api/profiles', { name: 'Ethan' });
      const id = created.data.id;
      await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 2] });
      const res = await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [] });
      expect(res.status).toBe(200);
      expect(res.data.pokemon).toEqual([]);
    });

    it('returns 400 when pokemonIds has more than 6 entries', async () => {
      const created = await axios.post('/api/profiles', { name: 'Lance' });
      await expect(
        axios.put(`/api/profiles/${created.data.id}/team`, {
          pokemonIds: [1, 2, 3, 4, 5, 6, 7],
        })
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it('returns 400 when pokemonIds is null', async () => {
      const created = await axios.post('/api/profiles', { name: 'Clair' });
      await expect(
        axios.put(`/api/profiles/${created.data.id}/team`, { pokemonIds: null })
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it('returns 404 for a non-existent profile id', async () => {
      await expect(
        axios.put('/api/profiles/999999/team', { pokemonIds: [1] })
      ).rejects.toMatchObject({ response: { status: 404 } });
    });

    it('returns 404 when any pokemon id does not exist', async () => {
      const created = await axios.post('/api/profiles', { name: 'Pryce' });
      await expect(
        axios.put(`/api/profiles/${created.data.id}/team`, { pokemonIds: [99999] })
      ).rejects.toMatchObject({ response: { status: 404 } });
    });
  });
});
```

- [ ] **Step 2: Run the profiles tests (backend must be running)**

```bash
nx e2e pokemon-user-backend-e2e -- --testPathPattern="profiles.spec"
```

Expected: 15 passing.

- [ ] **Step 3: Run the full e2e suite**

```bash
nx e2e pokemon-user-backend-e2e
```

Expected: 19 passing (4 pokemon + 15 profiles), 0 failures.

- [ ] **Step 4: Commit**

```bash
git add packages/pokemon-user-backend-e2e/src/pokemon-user-backend/profiles.spec.ts
git commit -m "test(e2e): add profiles CRUD and team update e2e tests"
```

---

## Self-Review

**Spec coverage check:**
- `GET /api/pokemon` → Task 3, 4 tests ✓
- `GET /api/profiles` → Task 4 (3 tests: empty, lists, structure) ✓
- `POST /api/profiles` → Task 4 (3 tests: create, no-name 400, blank 400) ✓
- `GET /api/profiles/:id` → Task 4 (3 tests: empty team, with team, 404) ✓
- `PUT /api/profiles/:id/team` → Task 4 (8 tests: set, names, replace, empty, >6 400, null 400, profile 404, pokemon 404) ✓

**No-placeholder check:** All assertions use concrete values from the Java source (pokemon names from `V4__seed_pokemon.sql`, status codes from the exception handler, `pokemon: []` from `ProfileMapper.toDto`). ✓

**Type consistency:**
- `pokemon[0].name` assertions use lowercase names matching the SQL seed values ✓
- `ProfileDto` always includes `pokemon` field — tests reflect this in all three profile read paths ✓
- `profile_pokemon` table name in `test-setup.ts` TRUNCATE matches `V3__create_profile_pokemon.sql` ✓
