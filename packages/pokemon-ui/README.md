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
