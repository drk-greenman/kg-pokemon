# Spring Boot Backend Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Spring Boot (Java 25 / Maven) backend scaffold at `packages/pokemon-user-backend-java/` integrated into the existing Nx + Tilt framework, with hot reload via Spring Boot DevTools and Tilt `live_update`.

**Architecture:** A new Maven project lives alongside (but replaces at runtime) the NestJS backend. Tilt builds a Docker image from `maven:3-eclipse-temurin-25-alpine` — Maven is present in the container so `live_update` can run `mvn compile` via `docker exec` when source files change, and Spring Boot DevTools restarts the app context on classpath changes. The root Tiltfile is updated to exclude the NestJS backend and its migration resources.

**Tech Stack:** Java 25, Spring Boot 3.5.0, Maven, Spring Web, Spring Boot DevTools, Docker (`maven:3-eclipse-temurin-25-alpine`), Kubernetes (local), Tilt, Nx `run-commands`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `packages/pokemon-user-backend-java/pom.xml` | Maven project descriptor — coordinates, deps, Spring Boot plugin |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/PokemonUserBackendApplication.java` | `@SpringBootApplication` entry point |
| Create | `packages/pokemon-user-backend-java/src/main/resources/application.properties` | Server port (3000), DevTools poll settings |
| Create | `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/PokemonUserBackendApplicationTests.java` | Spring context load test |
| Create | `packages/pokemon-user-backend-java/Dockerfile` | Dev image — Maven + JDK 25, `CMD mvn spring-boot:run` |
| Create | `packages/pokemon-user-backend-java/k8s/local/deployment.yaml` | k8s Deployment + Service for the Java backend |
| Create | `packages/pokemon-user-backend-java/Tiltfile` | `docker_build` with `live_update`, `k8s_yaml`, `k8s_resource` |
| Create | `packages/pokemon-user-backend-java/project.json` | Nx `build`, `test`, `serve` targets via `run-commands` |
| Modify | `Tiltfile` | Remove NestJS include + migration resources; add Java backend include |

---

### Task 1: Create pom.xml

**Files:**
- Create: `packages/pokemon-user-backend-java/pom.xml`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend
mkdir -p packages/pokemon-user-backend-java/src/main/resources
mkdir -p packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend
mkdir -p packages/pokemon-user-backend-java/k8s/local
```

- [ ] **Step 2: Write `pom.xml`**

Create `packages/pokemon-user-backend-java/pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.0</version>
        <relativePath/>
    </parent>

    <groupId>com.pokemon</groupId>
    <artifactId>pokemon-user-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>pokemon-user-backend</name>
    <description>Pokemon User Backend</description>

    <properties>
        <java.version>25</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-devtools</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

Note: `spring-boot-devtools` is excluded from `mvn package` (fat JAR) but remains on the classpath for `mvn spring-boot:run`. `spring-boot-starter-test` pulls in JUnit 5 + Mockito.

- [ ] **Step 3: Verify the POM is valid**

Run from the monorepo root:
```bash
mvn validate -f packages/pokemon-user-backend-java/pom.xml
```
Expected output: `BUILD SUCCESS`

---

### Task 2: Application source + contextLoads test (TDD)

**Files:**
- Create: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/PokemonUserBackendApplicationTests.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/PokemonUserBackendApplication.java`
- Create: `packages/pokemon-user-backend-java/src/main/resources/application.properties`

- [ ] **Step 1: Write the failing test**

Create `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/PokemonUserBackendApplicationTests.java`:

```java
package com.pokemon.userbackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class PokemonUserBackendApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

`@SpringBootTest` with no `webEnvironment` argument uses `WebEnvironment.MOCK` by default — it does not bind an actual port, so this test is safe to run without a live server.

- [ ] **Step 2: Run the test to verify it fails**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```
Expected: `BUILD FAILURE` — compilation error: `cannot find symbol: class PokemonUserBackendApplication`

- [ ] **Step 3: Write the application entry point**

Create `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/PokemonUserBackendApplication.java`:

```java
package com.pokemon.userbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PokemonUserBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PokemonUserBackendApplication.class, args);
    }
}
```

- [ ] **Step 4: Write application.properties**

Create `packages/pokemon-user-backend-java/src/main/resources/application.properties`:

```properties
server.port=3000
spring.devtools.restart.poll-interval=1000ms
spring.devtools.restart.quiet-period=400ms
```

`server.port=3000` matches the k8s container port (Spring Boot defaults to 8080). The DevTools poll settings give ~1-1.4 second hot reload latency after `mvn compile` runs.

- [ ] **Step 5: Run the test to verify it passes**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```
Expected output:
```
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 6: Commit**

```bash
git add packages/pokemon-user-backend-java/pom.xml \
        packages/pokemon-user-backend-java/src/
git commit -m "feat: scaffold Spring Boot application with contextLoads test"
```

---

### Task 3: Dockerfile

**Files:**
- Create: `packages/pokemon-user-backend-java/Dockerfile`

- [ ] **Step 1: Write the Dockerfile**

Create `packages/pokemon-user-backend-java/Dockerfile`:

```dockerfile
FROM maven:3-eclipse-temurin-25-alpine

WORKDIR /app

# Resolve dependencies as a separate layer — cached unless pom.xml changes
COPY packages/pokemon-user-backend-java/pom.xml ./pom.xml
RUN mvn dependency:resolve -q

COPY packages/pokemon-user-backend-java/src ./src

CMD ["mvn", "spring-boot:run"]
```

The build context is the monorepo root (set in the Tiltfile), so `COPY` paths start from there. Maven is available in the runtime image, which enables the `live_update` compile step without requiring local Maven.

- [ ] **Step 2: Verify the image builds**

Run from the monorepo root:
```bash
docker build \
  -t pokemon-user-backend-java-test \
  -f packages/pokemon-user-backend-java/Dockerfile \
  .
```
Expected: image builds successfully, Maven downloads dependencies during the `dependency:resolve` layer.

- [ ] **Step 3: Verify the container starts**

```bash
docker run --rm -p 3000:3000 pokemon-user-backend-java-test
```
Expected: Spring Boot logs appear and the server starts on port 3000. `Ctrl+C` to stop.

- [ ] **Step 4: Commit**

```bash
git add packages/pokemon-user-backend-java/Dockerfile
git commit -m "feat: add dev Dockerfile for Spring Boot backend"
```

---

### Task 4: k8s Deployment YAML

**Files:**
- Create: `packages/pokemon-user-backend-java/k8s/local/deployment.yaml`

- [ ] **Step 1: Write the deployment YAML**

Create `packages/pokemon-user-backend-java/k8s/local/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pokemon-user-backend-java
  labels:
    app: pokemon-user-backend-java
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pokemon-user-backend-java
  template:
    metadata:
      labels:
        app: pokemon-user-backend-java
    spec:
      containers:
        - name: pokemon-user-backend-java
          image: pokemon-user-backend-java
          ports:
            - containerPort: 3000
          env:
            - name: DB_HOST
              value: pokemon-postgres-service
            - name: DB_PORT
              value: '5432'
            - name: DB_USERNAME
              value: admin
            - name: DB_PASSWORD
              value: admin
            - name: DB_NAME
              value: pokemon
---
apiVersion: v1
kind: Service
metadata:
  name: pokemon-user-backend-java-service
spec:
  selector:
    app: pokemon-user-backend-java
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: LoadBalancer
```

- [ ] **Step 2: Validate the YAML**

```bash
kubectl apply --dry-run=client \
  -f packages/pokemon-user-backend-java/k8s/local/deployment.yaml
```
Expected:
```
deployment.apps/pokemon-user-backend-java configured (dry run)
service/pokemon-user-backend-java-service configured (dry run)
```

- [ ] **Step 3: Commit**

```bash
git add packages/pokemon-user-backend-java/k8s/
git commit -m "feat: add k8s deployment for Spring Boot backend"
```

---

### Task 5: Package Tiltfile

**Files:**
- Create: `packages/pokemon-user-backend-java/Tiltfile`

- [ ] **Step 1: Write the package Tiltfile**

Create `packages/pokemon-user-backend-java/Tiltfile`:

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

How hot reload works:
1. Tilt watches files under `packages/pokemon-user-backend-java/src/`
2. On change: `sync` pushes updated source files into `/app/src/` in the running container (paths in `sync()` are relative to the `docker_build` context, i.e. the monorepo root)
3. `run` executes `mvn compile -q` **inside the container** via `docker exec` — Maven is available because the image is `maven:3-eclipse-temurin-25-alpine`; new `.class` files are written to `/app/target/classes/`
4. Spring Boot DevTools (running in the `spring-boot:run` process) detects the updated classes and restarts the app context in ~1–3 seconds

- [ ] **Step 2: Commit**

```bash
git add packages/pokemon-user-backend-java/Tiltfile
git commit -m "feat: add Tiltfile for Spring Boot backend with live_update hot reload"
```

---

### Task 6: Nx project.json

**Files:**
- Create: `packages/pokemon-user-backend-java/project.json`

- [ ] **Step 1: Write project.json**

Create `packages/pokemon-user-backend-java/project.json`:

```json
{
  "name": "pokemon-user-backend-java",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/pokemon-user-backend-java/src",
  "projectType": "application",
  "tags": [],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn package -q -DskipTests",
        "cwd": "packages/pokemon-user-backend-java"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn test",
        "cwd": "packages/pokemon-user-backend-java"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn spring-boot:run",
        "cwd": "packages/pokemon-user-backend-java"
      }
    }
  }
}
```

`lint` is intentionally omitted — Checkstyle will be configured with the Google style guide in a follow-up. `build` skips tests (`-DskipTests`) because `nx test` is the dedicated test target.

Note: `nx build` and `nx test` require Maven installed locally. The primary development path is `tilt up` (no local Maven needed).

- [ ] **Step 2: Verify Nx recognises the project**

```bash
nx show project pokemon-user-backend-java
```
Expected: JSON output listing the three targets (`build`, `test`, `serve`).

- [ ] **Step 3: Commit**

```bash
git add packages/pokemon-user-backend-java/project.json
git commit -m "feat: add Nx project.json for Spring Boot backend"
```

---

### Task 7: Update root Tiltfile

**Files:**
- Modify: `Tiltfile`

- [ ] **Step 1: Open the root Tiltfile**

Current content of `Tiltfile` (lines 18–42 are the parts that change):

```python
watch_settings(ignore=['.nx/**', 'packages/**/vite.config.ts.timestamp-*.mjs'])

include('./tilt/postgres/Tiltfile')
include('./packages/pokemon-user-backend/Tiltfile')   # <-- remove
include('./packages/pokemon-ui/Tiltfile')

local_resource(                                        # <-- remove entire block
    'db: migration:up',
    cmd=[
        'bash', '-c',
        'cd packages/pokemon-user-backend && pnpm mikro-orm migration:up'
    ],
    resource_deps=['pokemon-postgres'],
    labels=['database']
)

local_resource(                                        # <-- remove entire block
    'db: migration:create',
    cmd=[
        'bash', '-c',
        'cd packages/pokemon-user-backend && pnpm mikro-orm migration:create'
    ],
    resource_deps=['pokemon-postgres'],
    auto_init=False,
    trigger_mode=TRIGGER_MODE_MANUAL,
    labels=['database']
)
```

- [ ] **Step 2: Write the updated root Tiltfile**

Replace the entire content of `Tiltfile` with:

```python
# Pokemon Interview — Tilt dev environment
#
# Prerequisites:
#   - Docker Desktop with Kubernetes enabled (or any local k8s cluster)
#   - tilt (https://docs.tilt.dev/install.html)
#
# Usage:
#   tilt up     — start everything
#   tilt down   — tear down all resources
#
# Services:
#   Postgres  → localhost:5432  (admin/admin, db: pokemon)  [k8s]
#   Backend   → localhost:3000/api                          [k8s + docker]
#   Frontend  → localhost:4200                              [local vite dev server]

watch_settings(ignore=['.nx/**', 'packages/**/vite.config.ts.timestamp-*.mjs'])

include('./tilt/postgres/Tiltfile')
include('./packages/pokemon-user-backend-java/Tiltfile')
include('./packages/pokemon-ui/Tiltfile')
```

- [ ] **Step 3: Verify Tilt parses the updated file**

```bash
tilt ci --timeout 10s 2>&1 | head -20
```
Expected: Tilt loads without parse errors. It will attempt to start services; `--timeout 10s` causes it to exit quickly — ignore timeout/connection errors, look only for Tiltfile parse errors.

Alternatively: run `tilt up` and confirm:
- `pokemon-postgres` starts
- `pokemon-user-backend-java` builds and deploys (takes several minutes on first run while Maven downloads deps)
- `pokemon-ui` starts
- No `pokemon-user-backend` (NestJS) resource appears in the Tilt UI
- `curl http://localhost:3000/api` returns a response once the Java backend is ready

- [ ] **Step 4: Commit**

```bash
git add Tiltfile
git commit -m "chore: replace NestJS backend with Spring Boot backend in Tilt"
```
