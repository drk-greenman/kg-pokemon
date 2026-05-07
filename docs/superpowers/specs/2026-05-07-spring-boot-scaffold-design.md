# Spring Boot Backend Scaffold — Design Spec

**Date:** 2026-05-07  
**Status:** Approved

## Overview

Add a Spring Boot (Java 25 / Maven) backend as a new package in the monorepo, integrated into the existing Nx + Tilt framework. The NestJS backend (`packages/pokemon-user-backend`) remains in the repo but is excluded from `tilt up`. This scaffold mirrors the structure produced by Spring Initializr at start.spring.io and includes hot reload support via Spring Boot DevTools + Tilt `live_update`.

---

## Package Structure

New package at `packages/pokemon-user-backend-java/`, following the Spring Initializr layout:

```
packages/pokemon-user-backend-java/
├── pom.xml
├── Dockerfile
├── Tiltfile
├── k8s/
│   └── local/
│       └── deployment.yaml
└── src/
    ├── main/
    │   ├── java/com/pokemon/userbackend/
    │   │   └── PokemonUserBackendApplication.java
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/pokemon/userbackend/
            └── PokemonUserBackendApplicationTests.java
```

**Maven coordinates:**
- Group ID: `com.pokemon`
- Artifact ID: `pokemon-user-backend`
- Version: `0.0.1-SNAPSHOT`
- Package: `com.pokemon.userbackend`

**Spring Boot version:** 3.5.x (latest stable)  
**Java version:** 25  
**Initial dependencies:** Spring Web, Spring Boot DevTools

---

## Hot Reload: Docker + Tilt `live_update`

Hot reload requires no local Maven installation — everything runs inside Docker.

### How it works

1. The Dockerfile is based on `maven:3-eclipse-temurin-25-alpine` for both build and runtime (Maven is present in the container).
2. `tilt up` builds the image. The `mvn dependency:resolve` step is an early Docker layer, so dependency downloads are cached across rebuilds.
3. The container starts with `mvn spring-boot:run`. Spring Boot DevTools is on the classpath and monitors `target/classes/` for changes.
4. When a `.java` file is saved, Tilt's `live_update` fires two steps:
   - **sync** — pushes changed files from `packages/pokemon-user-backend-java/src/` into `/app/src/` in the container
   - **run** — executes `mvn compile -q -f /app/pom.xml` via `docker exec`
5. DevTools detects the updated `.class` files and restarts the app context (~1–3 seconds).

### DevTools tuning

`application.properties` will include:
```properties
server.port=3000
spring.devtools.restart.poll-interval=1000ms
spring.devtools.restart.quiet-period=400ms
```

`server.port=3000` is required to match the k8s container port (Spring Boot defaults to 8080).

---

## Tilt Integration

### Root `Tiltfile` changes

- Remove `include('./packages/pokemon-user-backend/Tiltfile')` — NestJS backend no longer started.
- Remove `db: migration:up` and `db: migration:create` local_resources — these depend on MikroORM/NestJS; no migrations exist in the scaffold.
- Add `include('./packages/pokemon-user-backend-java/Tiltfile')`.
- PostgreSQL resource is unchanged.

### `packages/pokemon-user-backend-java/Tiltfile`

```python
docker_build(
    'pokemon-user-backend-java',
    '../../',
    dockerfile='../../packages/pokemon-user-backend-java/Dockerfile',
    live_update=[
        sync('./packages/pokemon-user-backend-java/src', '/app/src'),
        run('mvn compile -q -f /app/pom.xml'),
    ]
)

k8s_yaml(['./k8s/local/deployment.yaml'])

k8s_resource(
    'pokemon-user-backend-java',
    port_forwards=3000,
    resource_deps=['pokemon-postgres'],
    labels=['backend'],
    links=['http://localhost:3000/api']
)
```

### k8s Deployment (`k8s/local/deployment.yaml`)

Mirrors the NestJS deployment:
- Image: `pokemon-user-backend-java`
- Container port: `3000`
- Env vars: `DB_HOST`, `DB_PORT` (5432), `DB_USERNAME` (admin), `DB_PASSWORD` (admin), `DB_NAME` (pokemon)
- Service type: `LoadBalancer`, port 3000

---

## Nx Integration

`packages/pokemon-user-backend-java/project.json` defines custom targets via `nx:run-commands`:

| Nx target | Maven command |
|---|---|
| `nx build pokemon-user-backend-java` | `mvn package -q -DskipTests` |
| `nx test pokemon-user-backend-java` | `mvn test` |
| `nx serve pokemon-user-backend-java` | `mvn spring-boot:run` |

`lint` is intentionally omitted. The default Maven Checkstyle (Sun style) is too strict; the Google style guide will be configured in a follow-up.

---

## Out of Scope

- Database entities, repositories, or migrations (future work)
- API endpoints beyond the scaffold's default health/hello stub
- Production Dockerfile (separate JRE image without Maven)
- Checkstyle / lint configuration
