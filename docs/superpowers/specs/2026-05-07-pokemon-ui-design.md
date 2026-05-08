# Pokémon Team Builder UI Design

**Date:** 2026-05-07
**Package:** `pokemon-ui`
**Stack:** React 19, Vite, MUI, Emotion CSS, Axios, React Router, Vitest + React Testing Library

---

## Goal

Build the React SPA for the Pokémon Team Builder. Users browse the first 150 Pokémon, select up to 6 for a team, and save teams to named profiles. The design is functional and simple — no features beyond what the backend API supports.

---

## Views

Two views navigated via React Router.

| Route | Component | Purpose |
|---|---|---|
| `/` | `ProfileListPage` | List all profiles, create a new one |
| `/profiles/:id` | `TeamBuilderPage` | Browse Pokémon and edit a profile's team |

No shared global state between views. Each page owns its own fetch state.

---

## New Dependencies

| Package | Purpose |
|---|---|
| `@mui/material` | Component library |
| `@mui/icons-material` | Icons (back arrow, etc.) |
| `@emotion/react` + `@emotion/styled` | Already installed — MUI peer deps |
| `react-router-dom` | Client-side routing |

MUI requires `@emotion/react` and `@emotion/styled` as peer dependencies — both are already present in the workspace root `package.json`.

**Vite proxy:** The frontend dev server runs on port 4200; the backend runs on port 3000. `vite.config.ts` must add a `server.proxy` entry so that requests to `/api` are forwarded to `http://localhost:3000`. The Axios client uses baseURL `/api` (relative), relying on this proxy in dev.

---

## Component Tree

```
App
└── BrowserRouter
    ├── Route /                → ProfileListPage
    │     ├── MUI AppBar
    │     ├── MUI List (one ListItem per profile)
    │     └── NewProfileDialog (MUI Dialog)
    └── Route /profiles/:id   → TeamBuilderPage
          ├── MUI AppBar (back button + profile name + Save button)
          ├── TeamRow (sticky below AppBar — 6 slots)
          └── PokemonGrid
                └── PokemonCard × 150
```

---

## ProfileListPage

**Data:** `GET /api/profiles` on mount → `{ id, name }[]`.

**Rendering:**
- MUI `AppBar` with the app title.
- MUI `List` where each `ListItem` shows the profile name with a trailing chevron. Clicking navigates to `/profiles/:id`.
- A final `ListItem` styled as dashed reads "+ New Profile". Clicking opens `NewProfileDialog`.

**NewProfileDialog:**
- MUI `Dialog` with a single `TextField` for the profile name and a "Create" `Button`.
- On submit: `POST /api/profiles` with `{ name }`. On success, append the new profile to the local list and close the dialog.
- Create button is disabled while the name field is empty.

---

## TeamBuilderPage

**Data:** `GET /api/pokemon` and `GET /api/profiles/:id` fire in parallel on mount. Both must resolve before rendering (seeding `selectedPokemonIds` requires the profile response).

**Local state:**
- `selectedPokemonIds: number[]` — initialised from the profile's current team. This is the pending team the user edits locally before saving.

**AppBar:**
- Back `IconButton` (arrow left) — navigates to `/`.
- Profile name as the title.
- "Save" `Button` (right-aligned) — calls `PUT /api/profiles/:id/team` with `{ pokemonIds: selectedPokemonIds }`, then navigates to `/` on success.

**TeamRow:**
- Sticky strip pinned below the AppBar.
- Six slots rendered as small MUI `Avatar` components. Filled slots show the Pokémon sprite; empty slots show a dashed placeholder.
- Clicking a filled slot removes that Pokémon from `selectedPokemonIds`.

**PokemonGrid:**
- CSS grid of `PokemonCard` components, one per Pokémon (150 total).
- Each card: sprite image + name below.
- **Selected:** card has a highlighted border/background.
- **At cap (6 selected) and not selected:** card renders at reduced opacity and ignores clicks.
- Clicking a non-capped unselected card appends its ID to `selectedPokemonIds`. Clicking a selected card removes it.

**Sprite URL:** derived client-side — `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

---

## Loading & Error States

**Loading:** MUI `CircularProgress` centered on the page while fetches are in flight.

**Fetch error:** MUI `Alert` with `severity="error"` replaces page content. Message: "Something went wrong" + the error detail.

**Save failure:** MUI `Snackbar` with `severity="error"`. Stay on the team builder page so the user doesn't lose their selection.

**Team cap:** When all 6 slots are filled, unselected cards render at reduced opacity and are non-interactive. No toast — the filled TeamRow communicates the state.

---

## Data Flow Summary

```
ProfileListPage mount
  → GET /api/profiles
  → render list

"+ New Profile" → dialog → POST /api/profiles → append to list

ListItem click → navigate /profiles/:id

TeamBuilderPage mount
  → GET /api/pokemon (parallel)
  → GET /api/profiles/:id (parallel)
  → seed selectedPokemonIds from profile.pokemon

PokemonCard click → toggle ID in selectedPokemonIds (cap 6)
TeamRow slot click → remove ID from selectedPokemonIds

Save → PUT /api/profiles/:id/team { pokemonIds }
     → success: navigate /
     → failure: Snackbar error
```

---

## File Structure

New files under `packages/pokemon-ui/src/`:

```
app/
  app.tsx                        ← replace NxWelcome; set up BrowserRouter + routes
  pages/
    ProfileListPage.tsx
    TeamBuilderPage.tsx
  components/
    NewProfileDialog.tsx
    TeamRow.tsx
    PokemonGrid.tsx
    PokemonCard.tsx
  api/
    client.ts                    ← Axios instance (baseURL: /api)
    pokemon.ts                   ← getPokemons()
    profiles.ts                  ← getProfiles(), createProfile(), getProfile(), updateTeam()
  types/
    index.ts                     ← Pokemon, Profile, ProfileDetail interfaces
```

---

## Testing

Vitest + React Testing Library. Mock Axios at the module level.

| Component / Page | What to test |
|---|---|
| `PokemonCard` | Renders sprite + name; applies selected style; ignores clicks when at cap and unselected |
| `TeamRow` | Renders 6 slots; fills from `selectedPokemonIds`; fires remove callback on filled slot click |
| `ProfileListPage` | Renders profile list from mocked API; opens dialog on "+ New Profile"; closes and appends on successful create |
| `TeamBuilderPage` | Seeds `selectedPokemonIds` from profile fetch; toggles selection; enforces cap of 6; calls correct API on Save |

---

## Out of Scope

- Delete profile
- Search / filter Pokémon list
- Duplicate Pokémon detection within a team
- Pagination (150 records rendered all at once)
- Authentication
- Playwright E2E tests (scaffold exists but not wired up here)
