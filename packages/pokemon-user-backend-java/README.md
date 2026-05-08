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
