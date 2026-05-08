# Pokémon Team Builder UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React SPA for the Pokémon Team Builder — profile list, team builder, and a REST API layer — on top of the existing `pokemon-ui` scaffold.

**Architecture:** Two-page React Router SPA. Each page manages its own fetch state (no global state). Components are built bottom-up from pure, prop-driven primitives (PokemonCard, TeamRow, PokemonGrid, NewProfileDialog) into full pages (ProfileListPage, TeamBuilderPage). A thin Axios API layer (`api/`) is the only place that talks to the backend.

**Tech Stack:** React 19, React Router DOM v7, MUI v6, Emotion CSS (`css` prop — no pragma needed, `jsxImportSource` is already configured to `@emotion/react`), Axios, Vitest, React Testing Library

---

## File Map

| Action | Path |
|--------|------|
| Modify | `packages/pokemon-ui/vite.config.ts` |
| Create | `packages/pokemon-ui/src/app/types/index.ts` |
| Create | `packages/pokemon-ui/src/app/api/client.ts` |
| Create | `packages/pokemon-ui/src/app/api/pokemon.ts` |
| Create | `packages/pokemon-ui/src/app/api/profiles.ts` |
| Create | `packages/pokemon-ui/src/app/components/PokemonCard.tsx` |
| Create | `packages/pokemon-ui/src/app/components/PokemonCard.spec.tsx` |
| Create | `packages/pokemon-ui/src/app/components/TeamRow.tsx` |
| Create | `packages/pokemon-ui/src/app/components/TeamRow.spec.tsx` |
| Create | `packages/pokemon-ui/src/app/components/PokemonGrid.tsx` |
| Create | `packages/pokemon-ui/src/app/components/PokemonGrid.spec.tsx` |
| Create | `packages/pokemon-ui/src/app/components/NewProfileDialog.tsx` |
| Create | `packages/pokemon-ui/src/app/components/NewProfileDialog.spec.tsx` |
| Create | `packages/pokemon-ui/src/app/pages/ProfileListPage.tsx` |
| Create | `packages/pokemon-ui/src/app/pages/ProfileListPage.spec.tsx` |
| Create | `packages/pokemon-ui/src/app/pages/TeamBuilderPage.tsx` |
| Create | `packages/pokemon-ui/src/app/pages/TeamBuilderPage.spec.tsx` |
| Modify | `packages/pokemon-ui/src/app/app.tsx` |
| Modify | `packages/pokemon-ui/src/app/app.spec.tsx` |

---

## Task 1: Install Dependencies and Configure Vite Proxy

**Files:**
- Modify: `packages/pokemon-ui/vite.config.ts`

The frontend runs on port 4200; the backend on port 3000. Without the proxy, requests to `/api` would hit the wrong port. The Axios client uses a relative `baseURL: '/api'` and relies on this proxy in dev.

MUI peer deps (`@emotion/react`, `@emotion/styled`) are already in the root `package.json`. `@types/react-router-dom` is not needed — react-router-dom v6+ bundles its own types.

- [ ] **Step 1: Install packages**

Run from the repo root:
```bash
pnpm add @mui/material @mui/icons-material react-router-dom
```

Expected: packages resolve and `node_modules/.pnpm` is updated without peer-dep errors.

- [ ] **Step 2: Add `/api` proxy to Vite config**

Open `packages/pokemon-ui/vite.config.ts`. Replace the `server` block:

```ts
server: {
  port: 4200,
  host: 'localhost',
  proxy: {
    '/api': 'http://localhost:3000',
  },
},
```

Full file after edit:
```ts
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/pokemon-ui',

  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [react(), nxViteTsPaths()],

  build: {
    outDir: '../../dist/packages/pokemon-ui',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/pokemon-ui',
      provider: 'v8',
    },
  },
});
```

- [ ] **Step 3: Verify existing tests still pass**

```bash
nx test pokemon-ui
```

Expected: 2 passing tests (the existing `App` describe block).

- [ ] **Step 4: Commit**

```bash
git add packages/pokemon-ui/vite.config.ts pnpm-lock.yaml package.json
git commit -m "feat(pokemon-ui): install MUI, react-router-dom; add /api proxy"
```

---

## Task 2: Define Shared TypeScript Types

**Files:**
- Create: `packages/pokemon-ui/src/app/types/index.ts`

These interfaces mirror the JSON shapes returned by the backend API exactly. They are used everywhere — API functions, component props, page state.

- [ ] **Step 1: Create the types file**

```ts
// packages/pokemon-ui/src/app/types/index.ts
export interface Pokemon {
  id: number;
  name: string;
}

export interface Profile {
  id: number;
  name: string;
}

export interface ProfileDetail extends Profile {
  pokemon: Pokemon[];
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/pokemon-ui/src/app/types/index.ts
git commit -m "feat(pokemon-ui): add shared TypeScript types"
```

---

## Task 3: Create the API Layer

**Files:**
- Create: `packages/pokemon-ui/src/app/api/client.ts`
- Create: `packages/pokemon-ui/src/app/api/pokemon.ts`
- Create: `packages/pokemon-ui/src/app/api/profiles.ts`

All API calls go through a single Axios instance. This is the only place that knows about `baseURL`. Tests mock these modules directly — never mock Axios itself.

- [ ] **Step 1: Create the Axios client**

```ts
// packages/pokemon-ui/src/app/api/client.ts
import axios from 'axios';

export default axios.create({ baseURL: '/api' });
```

- [ ] **Step 2: Create the Pokémon API module**

```ts
// packages/pokemon-ui/src/app/api/pokemon.ts
import client from './client';
import type { Pokemon } from '../types';

export async function getPokemons(): Promise<Pokemon[]> {
  const { data } = await client.get<Pokemon[]>('/pokemon');
  return data;
}
```

- [ ] **Step 3: Create the profiles API module**

```ts
// packages/pokemon-ui/src/app/api/profiles.ts
import client from './client';
import type { Profile, ProfileDetail } from '../types';

export async function getProfiles(): Promise<Profile[]> {
  const { data } = await client.get<Profile[]>('/profiles');
  return data;
}

export async function createProfile(name: string): Promise<Profile> {
  const { data } = await client.post<Profile>('/profiles', { name });
  return data;
}

export async function getProfile(id: number): Promise<ProfileDetail> {
  const { data } = await client.get<ProfileDetail>(`/profiles/${id}`);
  return data;
}

export async function updateTeam(id: number, pokemonIds: number[]): Promise<ProfileDetail> {
  const { data } = await client.put<ProfileDetail>(`/profiles/${id}/team`, { pokemonIds });
  return data;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
nx build pokemon-ui
```

Expected: build succeeds (new files are type-safe).

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-ui/src/app/api/
git commit -m "feat(pokemon-ui): add Axios API layer (pokemon, profiles)"
```

---

## Task 4: PokemonCard Component (TDD)

**Files:**
- Create: `packages/pokemon-ui/src/app/components/PokemonCard.spec.tsx`
- Create: `packages/pokemon-ui/src/app/components/PokemonCard.tsx`

Props contract:
- `pokemon: Pokemon` — the Pokémon to display
- `count: number` — how many times it appears in `selectedPokemonIds` (0 = not on team)
- `atCap: boolean` — team has 6 members; card must be non-interactive
- `onSelect: (id: number) => void` — called when card is clicked (only when not at cap)

Sprite URL is derived client-side: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/pokemon-ui/src/app/components/PokemonCard.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PokemonCard } from './PokemonCard';

const charmander = { id: 4, name: 'Charmander' };

describe('PokemonCard', () => {
  it('renders the sprite and name', () => {
    render(<PokemonCard pokemon={charmander} count={0} atCap={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png'
    );
    expect(screen.getByText('Charmander')).toBeTruthy();
  });

  it('shows a count badge when the pokemon is on the team', () => {
    render(<PokemonCard pokemon={charmander} count={2} atCap={false} onSelect={vi.fn()} />);
    expect(screen.getByText('×2')).toBeTruthy();
  });

  it('shows no badge when count is 0', () => {
    render(<PokemonCard pokemon={charmander} count={0} atCap={false} onSelect={vi.fn()} />);
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it('calls onSelect with the pokemon id on click', () => {
    const onSelect = vi.fn();
    render(<PokemonCard pokemon={charmander} count={0} atCap={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it('does not call onSelect when atCap is true', () => {
    const onSelect = vi.fn();
    render(<PokemonCard pokemon={charmander} count={0} atCap={true} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test pokemon-ui -- --testNamePattern="PokemonCard"
```

Expected: FAIL — "Cannot find module './PokemonCard'"

- [ ] **Step 3: Implement PokemonCard**

```tsx
// packages/pokemon-ui/src/app/components/PokemonCard.tsx
import { css } from '@emotion/react';
import type { Pokemon } from '../types';

const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

interface Props {
  pokemon: Pokemon;
  count: number;
  atCap: boolean;
  onSelect: (id: number) => void;
}

export function PokemonCard({ pokemon, count, atCap, onSelect }: Props) {
  return (
    <button
      onClick={() => { if (!atCap) onSelect(pokemon.id); }}
      css={css`
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: none;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 8px;
        cursor: ${atCap ? 'default' : 'pointer'};
        opacity: ${atCap ? 0.4 : 1};
        width: 100%;
        &:hover {
          background: ${atCap ? 'none' : '#f5f5f5'};
        }
      `}
    >
      <img
        src={`${SPRITE_BASE}/${pokemon.id}.png`}
        alt={pokemon.name}
        width={64}
        height={64}
      />
      <span css={css`font-size: 12px; text-align: center; text-transform: capitalize;`}>
        {pokemon.name}
      </span>
      {count > 0 && (
        <span
          css={css`
            position: absolute;
            top: 4px;
            right: 4px;
            background: #1976d2;
            color: white;
            border-radius: 12px;
            padding: 0 6px;
            font-size: 11px;
            font-weight: bold;
          `}
        >
          ×{count}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
nx test pokemon-ui -- --testNamePattern="PokemonCard"
```

Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-ui/src/app/components/PokemonCard.tsx \
         packages/pokemon-ui/src/app/components/PokemonCard.spec.tsx
git commit -m "feat(pokemon-ui): add PokemonCard component"
```

---

## Task 5: TeamRow Component (TDD)

**Files:**
- Create: `packages/pokemon-ui/src/app/components/TeamRow.spec.tsx`
- Create: `packages/pokemon-ui/src/app/components/TeamRow.tsx`

Props contract:
- `selectedPokemonIds: number[]` — up to 6 IDs (may contain duplicates)
- `onRemove: (index: number) => void` — called with the slot index when a filled slot is clicked

Always renders exactly 6 slots. Filled slots show the Pokémon sprite (derived from the ID). Empty slots show a dashed placeholder. Clicking an empty slot does nothing.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/pokemon-ui/src/app/components/TeamRow.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamRow } from './TeamRow';

describe('TeamRow', () => {
  it('always renders 6 slots', () => {
    render(<TeamRow selectedPokemonIds={[]} onRemove={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('renders sprite images for filled slots', () => {
    render(<TeamRow selectedPokemonIds={[4, 7]} onRemove={vi.fn()} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute(
      'src',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png'
    );
    expect(imgs[1]).toHaveAttribute(
      'src',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png'
    );
  });

  it('calls onRemove with the slot index when a filled slot is clicked', () => {
    const onRemove = vi.fn();
    render(<TeamRow selectedPokemonIds={[4, 7]} onRemove={onRemove} />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('does not call onRemove when an empty slot is clicked', () => {
    const onRemove = vi.fn();
    render(<TeamRow selectedPokemonIds={[4]} onRemove={onRemove} />);
    fireEvent.click(screen.getAllByRole('button')[5]);
    expect(onRemove).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test pokemon-ui -- --testNamePattern="TeamRow"
```

Expected: FAIL — "Cannot find module './TeamRow'"

- [ ] **Step 3: Implement TeamRow**

```tsx
// packages/pokemon-ui/src/app/components/TeamRow.tsx
import { css } from '@emotion/react';
import { Avatar } from '@mui/material';

const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

const SLOTS = [0, 1, 2, 3, 4, 5];

interface Props {
  selectedPokemonIds: number[];
  onRemove: (index: number) => void;
}

export function TeamRow({ selectedPokemonIds, onRemove }: Props) {
  return (
    <div
      css={css`
        display: flex;
        gap: 8px;
        padding: 8px 16px;
        background: white;
        border-bottom: 1px solid #e0e0e0;
        position: sticky;
        top: 64px;
        z-index: 10;
      `}
    >
      {SLOTS.map(i => {
        const id = selectedPokemonIds[i];
        const filled = id != null;
        return (
          <button
            key={i}
            onClick={() => { if (filled) onRemove(i); }}
            css={css`
              background: none;
              border: ${filled ? 'none' : '2px dashed #bdbdbd'};
              border-radius: 50%;
              padding: 0;
              cursor: ${filled ? 'pointer' : 'default'};
              width: 56px;
              height: 56px;
              display: flex;
              align-items: center;
              justify-content: center;
            `}
          >
            {filled ? (
              <Avatar
                src={`${SPRITE_BASE}/${id}.png`}
                alt={`Slot ${i + 1}`}
                variant="square"
                sx={{ width: 48, height: 48 }}
              />
            ) : (
              <span
                css={css`
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: block;
                `}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
nx test pokemon-ui -- --testNamePattern="TeamRow"
```

Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-ui/src/app/components/TeamRow.tsx \
         packages/pokemon-ui/src/app/components/TeamRow.spec.tsx
git commit -m "feat(pokemon-ui): add TeamRow component"
```

---

## Task 6: PokemonGrid Component

**Files:**
- Create: `packages/pokemon-ui/src/app/components/PokemonGrid.spec.tsx`
- Create: `packages/pokemon-ui/src/app/components/PokemonGrid.tsx`

PokemonGrid is a pure layout component. It computes `count` and `atCap` from `selectedPokemonIds` and delegates all interaction logic to `PokemonCard`.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/pokemon-ui/src/app/components/PokemonGrid.spec.tsx
import { render, screen } from '@testing-library/react';
import { PokemonGrid } from './PokemonGrid';

const pokemon = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, name: `Pokemon ${i + 1}` }));

describe('PokemonGrid', () => {
  it('renders one card per pokemon', () => {
    render(<PokemonGrid pokemon={pokemon} selectedPokemonIds={[]} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('passes atCap=true to all cards when 6 are selected', () => {
    const sixIds = [1, 2, 3, 4, 5, 6];
    render(<PokemonGrid pokemon={pokemon} selectedPokemonIds={sixIds} onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toHaveStyle('opacity: 0.4');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test pokemon-ui -- --testNamePattern="PokemonGrid"
```

Expected: FAIL — "Cannot find module './PokemonGrid'"

- [ ] **Step 3: Implement PokemonGrid**

```tsx
// packages/pokemon-ui/src/app/components/PokemonGrid.tsx
import { css } from '@emotion/react';
import { PokemonCard } from './PokemonCard';
import type { Pokemon } from '../types';

interface Props {
  pokemon: Pokemon[];
  selectedPokemonIds: number[];
  onSelect: (id: number) => void;
}

export function PokemonGrid({ pokemon, selectedPokemonIds, onSelect }: Props) {
  const atCap = selectedPokemonIds.length >= 6;

  const countMap = selectedPokemonIds.reduce<Record<number, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 8px;
        padding: 16px;
      `}
    >
      {pokemon.map(p => (
        <PokemonCard
          key={p.id}
          pokemon={p}
          count={countMap[p.id] ?? 0}
          atCap={atCap}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
nx test pokemon-ui -- --testNamePattern="PokemonGrid"
```

Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-ui/src/app/components/PokemonGrid.tsx \
         packages/pokemon-ui/src/app/components/PokemonGrid.spec.tsx
git commit -m "feat(pokemon-ui): add PokemonGrid component"
```

---

## Task 7: NewProfileDialog Component (TDD)

**Files:**
- Create: `packages/pokemon-ui/src/app/components/NewProfileDialog.spec.tsx`
- Create: `packages/pokemon-ui/src/app/components/NewProfileDialog.tsx`

Props contract:
- `open: boolean` — controls MUI Dialog visibility
- `onClose: () => void` — called when dialog should close (Cancel button, backdrop click)
- `onCreate: (name: string) => Promise<void>` — async callback provided by parent; the dialog calls this and closes on success

The dialog owns the name input state. The Create button is disabled when the trimmed name is empty or when the async call is in flight.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/pokemon-ui/src/app/components/NewProfileDialog.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewProfileDialog } from './NewProfileDialog';

describe('NewProfileDialog', () => {
  it('disables the Create button when name is empty', () => {
    render(<NewProfileDialog open onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  });

  it('enables the Create button when name is entered', () => {
    render(<NewProfileDialog open onClose={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ash' } });
    expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled();
  });

  it('calls onCreate with the entered name on submit', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<NewProfileDialog open onClose={vi.fn()} onCreate={onCreate} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ash' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Ash'));
  });

  it('calls onClose after successful creation', async () => {
    const onClose = vi.fn();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<NewProfileDialog open onClose={onClose} onCreate={onCreate} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ash' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test pokemon-ui -- --testNamePattern="NewProfileDialog"
```

Expected: FAIL — "Cannot find module './NewProfileDialog'"

- [ ] **Step 3: Implement NewProfileDialog**

```tsx
// packages/pokemon-ui/src/app/components/NewProfileDialog.tsx
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function NewProfileDialog({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onCreate(name.trim());
      setName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New Profile</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Profile name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="dense"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
nx test pokemon-ui -- --testNamePattern="NewProfileDialog"
```

Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-ui/src/app/components/NewProfileDialog.tsx \
         packages/pokemon-ui/src/app/components/NewProfileDialog.spec.tsx
git commit -m "feat(pokemon-ui): add NewProfileDialog component"
```

---

## Task 8: ProfileListPage (TDD)

**Files:**
- Create: `packages/pokemon-ui/src/app/pages/ProfileListPage.spec.tsx`
- Create: `packages/pokemon-ui/src/app/pages/ProfileListPage.tsx`

Data: `GET /api/profiles` on mount → `Profile[]`. Each list item navigates to `/profiles/:id`. The "+ New Profile" item opens `NewProfileDialog`. On successful creation, the new profile is appended to the local list.

Tests mock the `profiles` API module. Must wrap in `<MemoryRouter>` because `ProfileListPage` uses `useNavigate`.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/pokemon-ui/src/app/pages/ProfileListPage.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileListPage } from './ProfileListPage';
import * as profilesApi from '../api/profiles';

vi.mock('../api/profiles');

const mockProfiles = [
  { id: 1, name: 'Ash' },
  { id: 2, name: 'Misty' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfileListPage />
    </MemoryRouter>
  );
}

describe('ProfileListPage', () => {
  beforeEach(() => {
    vi.mocked(profilesApi.getProfiles).mockResolvedValue(mockProfiles);
  });

  it('renders profiles returned by the API', async () => {
    renderPage();
    expect(await screen.findByText('Ash')).toBeTruthy();
    expect(screen.getByText('Misty')).toBeTruthy();
  });

  it('opens the dialog when "+ New Profile" is clicked', async () => {
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByText('+ New Profile'));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('appends the new profile to the list after successful creation', async () => {
    vi.mocked(profilesApi.createProfile).mockResolvedValue({ id: 3, name: 'Brock' });
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByText('+ New Profile'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Brock' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(screen.getByText('Brock')).toBeTruthy());
  });

  it('shows a loading indicator while fetching', () => {
    vi.mocked(profilesApi.getProfiles).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('shows an error alert when the fetch fails', async () => {
    vi.mocked(profilesApi.getProfiles).mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test pokemon-ui -- --testNamePattern="ProfileListPage"
```

Expected: FAIL — "Cannot find module './ProfileListPage'"

- [ ] **Step 3: Implement ProfileListPage**

```tsx
// packages/pokemon-ui/src/app/pages/ProfileListPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { css } from '@emotion/react';
import { NewProfileDialog } from '../components/NewProfileDialog';
import { getProfiles, createProfile } from '../api/profiles';
import type { Profile } from '../types';

export function ProfileListPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(err => setError(err.message ?? 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (name: string) => {
    const newProfile = await createProfile(name);
    setProfiles(prev => [...prev, newProfile]);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Pokémon Team Builder</Typography>
        </Toolbar>
      </AppBar>

      {loading && (
        <div css={css`display: flex; justify-content: center; margin-top: 64px;`}>
          <CircularProgress />
        </div>
      )}

      {error && (
        <Alert severity="error" css={css`margin: 16px;`}>
          Something went wrong — {error}
        </Alert>
      )}

      {!loading && !error && (
        <List>
          {profiles.map(profile => (
            <ListItem key={profile.id} disablePadding>
              <ListItemButton onClick={() => navigate(`/profiles/${profile.id}`)}>
                <ListItemText primary={profile.name} />
                <ChevronRight />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setDialogOpen(true)}
              css={css`border: 2px dashed #bdbdbd; border-radius: 4px; margin: 8px;`}
            >
              <ListItemText primary="+ New Profile" />
            </ListItemButton>
          </ListItem>
        </List>
      )}

      <NewProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
nx test pokemon-ui -- --testNamePattern="ProfileListPage"
```

Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-ui/src/app/pages/ProfileListPage.tsx \
         packages/pokemon-ui/src/app/pages/ProfileListPage.spec.tsx
git commit -m "feat(pokemon-ui): add ProfileListPage"
```

---

## Task 9: TeamBuilderPage (TDD)

**Files:**
- Create: `packages/pokemon-ui/src/app/pages/TeamBuilderPage.spec.tsx`
- Create: `packages/pokemon-ui/src/app/pages/TeamBuilderPage.tsx`

Data: `GET /api/pokemon` and `GET /api/profiles/:id` fire in parallel on mount. `selectedPokemonIds` is seeded from `profile.pokemon.map(p => p.id)`. The Save button calls `PUT /api/profiles/:id/team` and navigates to `/` on success; shows a Snackbar on failure.

`useParams()` returns strings — parse `id` with `Number(params.id)`. Tests mock both API modules and `useNavigate`.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/pokemon-ui/src/app/pages/TeamBuilderPage.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeamBuilderPage } from './TeamBuilderPage';
import * as pokemonApi from '../api/pokemon';
import * as profilesApi from '../api/profiles';

vi.mock('../api/pokemon');
vi.mock('../api/profiles');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async importOriginal => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

const mockPokemon = [
  { id: 1, name: 'Bulbasaur' },
  { id: 4, name: 'Charmander' },
  { id: 7, name: 'Squirtle' },
];

const mockProfile = {
  id: 1,
  name: 'Ash',
  pokemon: [{ id: 4, name: 'Charmander' }],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/profiles/1']}>
      <Routes>
        <Route path="/profiles/:id" element={<TeamBuilderPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TeamBuilderPage', () => {
  beforeEach(() => {
    vi.mocked(pokemonApi.getPokemons).mockResolvedValue(mockPokemon);
    vi.mocked(profilesApi.getProfile).mockResolvedValue(mockProfile);
    vi.mocked(profilesApi.updateTeam).mockResolvedValue({ ...mockProfile, pokemon: [] });
    mockNavigate.mockReset();
  });

  it('shows the profile name in the AppBar', async () => {
    renderPage();
    expect(await screen.findByText('Ash')).toBeTruthy();
  });

  it('seeds selectedPokemonIds from the profile — Charmander slot is filled', async () => {
    renderPage();
    await screen.findByText('Charmander');
    const teamImgs = screen.getAllByRole('img').filter(
      img => img.getAttribute('src')?.includes('/4.png')
    );
    expect(teamImgs.length).toBeGreaterThanOrEqual(1);
  });

  it('calls updateTeam with correct ids and profile id on Save', async () => {
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(profilesApi.updateTeam).toHaveBeenCalledWith(1, [4])
    );
  });

  it('navigates to / after a successful save', async () => {
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows a Snackbar error when save fails — stays on page', async () => {
    vi.mocked(profilesApi.updateTeam).mockRejectedValue(new Error('Server error'));
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/failed to save/i)).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a loading indicator before data is ready', () => {
    vi.mocked(pokemonApi.getPokemons).mockReturnValue(new Promise(() => {}));
    vi.mocked(profilesApi.getProfile).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('shows an error alert when a fetch fails', async () => {
    vi.mocked(pokemonApi.getPokemons).mockRejectedValue(new Error('Network'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
nx test pokemon-ui -- --testNamePattern="TeamBuilderPage"
```

Expected: FAIL — "Cannot find module './TeamBuilderPage'"

- [ ] **Step 3: Implement TeamBuilderPage**

```tsx
// packages/pokemon-ui/src/app/pages/TeamBuilderPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Button,
  CircularProgress,
  IconButton,
  Snackbar,
  Toolbar,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { css } from '@emotion/react';
import { TeamRow } from '../components/TeamRow';
import { PokemonGrid } from '../components/PokemonGrid';
import { getPokemons } from '../api/pokemon';
import { getProfile, updateTeam } from '../api/profiles';
import type { Pokemon } from '../types';

export function TeamBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const profileId = Number(id);
  const navigate = useNavigate();

  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [profileName, setProfileName] = useState('');
  const [selectedPokemonIds, setSelectedPokemonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPokemons(), getProfile(profileId)])
      .then(([pokemons, profile]) => {
        setPokemon(pokemons);
        setProfileName(profile.name);
        setSelectedPokemonIds(profile.pokemon.map(p => p.id));
      })
      .catch(err => setError(err.message ?? 'Unknown error'))
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleSelect = (pokemonId: number) => {
    setSelectedPokemonIds(prev => [...prev, pokemonId]);
  };

  const handleRemove = (index: number) => {
    setSelectedPokemonIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await updateTeam(profileId, selectedPokemonIds);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSaveError(`Failed to save team — ${msg}`);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" css={css`flex: 1; margin-left: 8px;`}>
            {profileName}
          </Typography>
          <Button color="inherit" onClick={handleSave}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      {loading && (
        <div css={css`display: flex; justify-content: center; margin-top: 64px;`}>
          <CircularProgress />
        </div>
      )}

      {error && (
        <Alert severity="error" css={css`margin: 16px;`}>
          Something went wrong — {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <TeamRow selectedPokemonIds={selectedPokemonIds} onRemove={handleRemove} />
          <PokemonGrid
            pokemon={pokemon}
            selectedPokemonIds={selectedPokemonIds}
            onSelect={handleSelect}
          />
        </>
      )}

      <Snackbar
        open={saveError != null}
        autoHideDuration={5000}
        onClose={() => setSaveError(null)}
      >
        <Alert severity="error" onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      </Snackbar>
    </>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
nx test pokemon-ui -- --testNamePattern="TeamBuilderPage"
```

Expected: 7 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-ui/src/app/pages/TeamBuilderPage.tsx \
         packages/pokemon-ui/src/app/pages/TeamBuilderPage.spec.tsx
git commit -m "feat(pokemon-ui): add TeamBuilderPage"
```

---

## Task 10: Wire Up App with Router

**Files:**
- Modify: `packages/pokemon-ui/src/app/app.tsx`
- Modify: `packages/pokemon-ui/src/app/app.spec.tsx`

Replace the NxWelcome placeholder with `BrowserRouter` + `Routes`. Update the spec to match the new app shell.

- [ ] **Step 1: Update app.spec.tsx**

```tsx
// packages/pokemon-ui/src/app/app.spec.tsx
import { render, screen } from '@testing-library/react';
import App from './app';

vi.mock('./pages/ProfileListPage', () => ({
  ProfileListPage: () => <div>Profile List</div>,
}));

describe('App', () => {
  it('renders successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('renders ProfileListPage at the root route', () => {
    const { getByText } = render(<App />);
    expect(getByText('Profile List')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the spec to see it fail**

```bash
nx test pokemon-ui -- --testNamePattern="App"
```

Expected: FAIL — "Profile List" not found (app still renders NxWelcome).

- [ ] **Step 3: Replace app.tsx**

```tsx
// packages/pokemon-ui/src/app/app.tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProfileListPage } from './pages/ProfileListPage';
import { TeamBuilderPage } from './pages/TeamBuilderPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProfileListPage />} />
        <Route path="/profiles/:id" element={<TeamBuilderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: Run all tests and verify they pass**

```bash
nx test pokemon-ui
```

Expected: all tests pass (no failures).

- [ ] **Step 5: Run lint**

```bash
nx lint pokemon-ui
```

Expected: no lint errors.

- [ ] **Step 6: Commit**

```bash
git add packages/pokemon-ui/src/app/app.tsx \
         packages/pokemon-ui/src/app/app.spec.tsx
git commit -m "feat(pokemon-ui): wire up BrowserRouter and routes in App"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Route `/` → ProfileListPage | Task 10 (App) |
| Route `/profiles/:id` → TeamBuilderPage | Task 10 (App) |
| Install MUI, react-router-dom | Task 1 |
| Vite `/api` proxy | Task 1 |
| Types: Pokemon, Profile, ProfileDetail | Task 2 |
| Axios client, getPokemons, profiles API | Task 3 |
| PokemonCard: sprite, name, badge, click, cap | Task 4 |
| TeamRow: 6 slots, sprites, onRemove | Task 5 |
| PokemonGrid: grid layout, atCap propagation | Task 6 |
| NewProfileDialog: MUI Dialog, disable, create | Task 7 |
| ProfileListPage: list, new-profile flow | Task 8 |
| TeamBuilderPage: parallel fetch, seed, cap, save, error | Task 9 |
| Loading state (CircularProgress) | Tasks 8, 9 |
| Fetch error state (Alert) | Tasks 8, 9 |
| Save failure (Snackbar, stay on page) | Task 9 |
| Sprite URL from PokeAPI | Tasks 4, 5 |

All spec requirements are covered. No placeholders. Types are consistent across tasks.
