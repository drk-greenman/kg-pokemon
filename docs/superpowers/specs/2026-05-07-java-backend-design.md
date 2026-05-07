# Java Backend Design — Pokemon User Backend

**Date:** 2026-05-07  
**Service:** `pokemon-user-backend-java`  
**Package:** `com.pokemon.userbackend`  
**Stack:** Spring Boot 3.5.0, Java 25, Spring Data JPA, Flyway, PostgreSQL

---

## Goal

Implement the REST API for the Pokemon Team Builder exercise inside the existing Spring Boot scaffold. Users can view the first 150 Pokémon, create profiles, and assign up to 6 Pokémon to a profile's team.

---

## Data Model

Three tables managed by Flyway migrations.

### `pokemon`
| Column | Type    | Constraints |
|--------|---------|-------------|
| id     | INTEGER | PK (Pokédex number 1–150, seeded — not auto-generated) |
| name   | VARCHAR | NOT NULL |

### `profile`
| Column  | Type    | Constraints |
|---------|---------|-------------|
| id      | SERIAL  | PK (auto-increment) |
| name    | VARCHAR | NOT NULL |
| version | BIGINT  | NOT NULL DEFAULT 0 (optimistic lock) |

### `profile_pokemon`
| Column     | Type    | Constraints |
|------------|---------|-------------|
| id         | SERIAL  | PK (auto-increment) |
| profile_id | INTEGER | FK → profile.id NOT NULL |
| pokemon_id | INTEGER | FK → pokemon.id NOT NULL |

**Production note (not implemented here):** In a production service, a stable `uuid` column would be exposed to clients instead of the integer PK so internal IDs are never leaked through the API.

### Flyway Migrations
- `V1__create_pokemon.sql`
- `V2__create_profile.sql`
- `V3__create_profile_pokemon.sql`
- `V4__seed_pokemon.sql` — inserts all 150 Pokémon by Pokédex number and name

---

## API

Global prefix: `/api`

| Method | Path | Request Body | Response | Description |
|--------|------|-------------|----------|-------------|
| GET | `/api/pokemon` | — | `[{ id, name }]` | List all 150 Pokémon |
| GET | `/api/profiles` | — | `[{ id, name }]` | List all profiles |
| POST | `/api/profiles` | `{ name }` | `{ id, name }` | Create a profile |
| GET | `/api/profiles/{id}` | — | `{ id, name, pokemon: [{ id, name }] }` | Get profile with team |
| PUT | `/api/profiles/{id}/team` | `{ pokemonIds: [1,4,7] }` | `{ id, name, pokemon: [{ id, name }] }` | Replace team atomically |

Sprite URLs are not stored or returned — the frontend derives them from the Pokémon id using the predictable PokeAPI sprite URL pattern.

---

## Architecture

### Package Structure

```
com.pokemon.userbackend/
  controller/
    PokemonController.java
    ProfileController.java
  service/
    PokemonService.java
    ProfileService.java
  repository/
    PokemonRepository.java
    ProfileRepository.java
    ProfilePokemonRepository.java
  entity/
    Pokemon.java
    Profile.java          ← carries @Version
    ProfilePokemon.java
  dto/
    PokemonDto.java            ← record { id, name }
    ProfileDto.java            ← record { id, name, List<PokemonDto> pokemon }
    CreateProfileRequest.java  ← record { name }
    UpdateTeamRequest.java     ← record { List<Integer> pokemonIds }
  mapper/
    PokemonMapper.java
    ProfileMapper.java
  exception/
    GlobalExceptionHandler.java
    ResourceNotFoundException.java
    TeamSizeExceededException.java
```

### Layers

**Controller** — receives HTTP requests, delegates to service, returns DTOs. No business logic.

**Service** — owns all business logic:
- `ProfileService.updateTeam` validates ≤ 6 Pokémon, verifies all Pokémon IDs exist, deletes existing `ProfilePokemon` rows, inserts new ones, saves Profile (triggering the version check), all within a single `@Transactional` method.
- `@Version` on `Profile` provides optimistic locking: concurrent `PUT /team` requests will both read the same version; the second to commit will receive an `OptimisticLockException`.

**Repository** — Spring Data JPA interfaces extending `JpaRepository`. No custom queries needed beyond what Spring Data infers from method names.

**Entity → DTO mapping** — manual mapper classes (no MapStruct). Each mapper is a Spring `@Component` with a single `toDto` method. DTOs are Java records using their canonical constructors directly — no builders.

---

## Error Handling

`GlobalExceptionHandler` (`@ControllerAdvice`) maps exceptions to HTTP status codes:

| Exception | Status | When |
|-----------|--------|------|
| `ResourceNotFoundException` | 404 | Profile or Pokémon id not found |
| `TeamSizeExceededException` | 400 | `pokemonIds` list has more than 6 entries |
| `OptimisticLockException` | 409 | Concurrent team update conflict |
| `MethodArgumentNotValidException` | 400 | Bean validation failure on request body |

Error responses use a consistent shape: `{ status, message }`.

---

## Dependencies to Add (`pom.xml`)

- `spring-boot-starter-data-jpa`
- `postgresql` (runtime)
- `flyway-core`

---

## Out of Scope

- Authentication / authorization
- Delete profile
- Pagination on Pokémon list (only 150 records)
- Duplicate Pokémon detection within a team (same Pokémon twice) — allowed for now, enforceable later in the service layer
