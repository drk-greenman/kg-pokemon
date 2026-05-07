# Java Backend API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full REST API for the Pokemon Team Builder in the existing Spring Boot scaffold at `packages/pokemon-user-backend-java/`.

**Architecture:** Flyway manages schema migrations; Spring Data JPA entities/repositories handle persistence; manual mapper classes convert entities to Java record DTOs; controllers delegate to services which own all business logic. A `@ControllerAdvice` handler maps domain exceptions to HTTP status codes.

**Tech Stack:** Java 25, Spring Boot 3.5.0, Spring Data JPA, Flyway, PostgreSQL (runtime), H2 (test), AssertJ, MockMvc, Mockito

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `packages/pokemon-user-backend-java/pom.xml` | Add JPA, PostgreSQL, Flyway, H2, Validation deps |
| Modify | `packages/pokemon-user-backend-java/src/main/resources/application.properties` | Add datasource, JPA, Flyway, context-path config |
| Create | `packages/pokemon-user-backend-java/src/test/resources/application.properties` | H2 in-memory config for tests |
| Create | `packages/pokemon-user-backend-java/src/main/resources/db/migration/V1__create_pokemon.sql` | pokemon table DDL |
| Create | `packages/pokemon-user-backend-java/src/main/resources/db/migration/V2__create_profile.sql` | profile table DDL |
| Create | `packages/pokemon-user-backend-java/src/main/resources/db/migration/V3__create_profile_pokemon.sql` | profile_pokemon join table DDL |
| Create | `packages/pokemon-user-backend-java/src/main/resources/db/migration/V4__seed_pokemon.sql` | Insert all 150 Pokemon |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity/Pokemon.java` | JPA entity — pokemon table |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity/Profile.java` | JPA entity — profile table, carries @Version |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity/ProfilePokemon.java` | JPA entity — profile_pokemon join table |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository/PokemonRepository.java` | JpaRepository for Pokemon |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository/ProfileRepository.java` | JpaRepository for Profile |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository/ProfilePokemonRepository.java` | JpaRepository for ProfilePokemon, derived delete |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/PokemonDto.java` | record { id, name } |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/ProfileDto.java` | record { id, name, List<PokemonDto> pokemon } |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/CreateProfileRequest.java` | record { @NotBlank String name } |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/UpdateTeamRequest.java` | record { List<Integer> pokemonIds } |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/ErrorResponse.java` | record { int status, String message } |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/mapper/PokemonMapper.java` | @Component — Pokemon entity → PokemonDto |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/mapper/ProfileMapper.java` | @Component — Profile entity + team → ProfileDto |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception/ResourceNotFoundException.java` | RuntimeException → 404 |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception/TeamSizeExceededException.java` | RuntimeException → 400 |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception/GlobalExceptionHandler.java` | @ControllerAdvice — maps exceptions to HTTP status |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/PokemonService.java` | findAll() → List<PokemonDto> |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/ProfileService.java` | findAll, create, getById, updateTeam |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/PokemonController.java` | GET /pokemon |
| Create | `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/ProfileController.java` | GET/POST /profiles, GET /profiles/{id}, PUT /profiles/{id}/team |
| Create | `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/PokemonServiceTest.java` | Unit test — mocks PokemonRepository |
| Create | `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/ProfileServiceTest.java` | Unit test — mocks all repositories |
| Create | `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/PokemonControllerTest.java` | @WebMvcTest — mocks PokemonService |
| Create | `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/ProfileControllerTest.java` | @WebMvcTest — mocks ProfileService |

---

### Task 1: Maven Dependencies + Application Config

**Files:**
- Modify: `packages/pokemon-user-backend-java/pom.xml`
- Modify: `packages/pokemon-user-backend-java/src/main/resources/application.properties`
- Create: `packages/pokemon-user-backend-java/src/test/resources/application.properties`

- [ ] **Step 1: Update pom.xml**

Replace the `<dependencies>` block in `packages/pokemon-user-backend-java/pom.xml` with:

```xml
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
```

Note: `flyway-database-postgresql` is required separately from `flyway-core` in Flyway 10+ (used by Spring Boot 3.x). Without it, Flyway silently skips PostgreSQL-specific features.

- [ ] **Step 2: Update main application.properties**

Replace the entire contents of `packages/pokemon-user-backend-java/src/main/resources/application.properties`:

```properties
server.port=3000
server.servlet.context-path=/api
spring.devtools.restart.poll-interval=1000ms
spring.devtools.restart.quiet-period=400ms

spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:pokemon}
spring.datasource.username=${DB_USERNAME:admin}
spring.datasource.password=${DB_PASSWORD:admin}
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

`${DB_HOST:localhost}` uses `localhost` as default when the env var is absent — convenient for running `mvn spring-boot:run` locally. In Tilt/k8s, the env vars in `deployment.yaml` override these.

- [ ] **Step 3: Create test application.properties**

Create `packages/pokemon-user-backend-java/src/test/resources/application.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=false
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=none
spring.flyway.enabled=true
```

`DATABASE_TO_UPPER=false` prevents H2 from uppercasing identifiers, matching PostgreSQL's lowercase convention. `ddl-auto=none` lets Flyway own the schema — Hibernate won't attempt validation against H2's type representations.

- [ ] **Step 4: Verify the existing contextLoads test still passes**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected:
```
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

The test uses H2 (test properties override main properties). It will fail before the next task because Flyway has no migrations yet — that's fine; fix it in Task 2.

- [ ] **Step 5: Commit**

```bash
git add packages/pokemon-user-backend-java/pom.xml \
        packages/pokemon-user-backend-java/src/main/resources/application.properties \
        packages/pokemon-user-backend-java/src/test/resources/application.properties
git commit -m "feat: add JPA, Flyway, PostgreSQL, and H2 test dependencies"
```

---

### Task 2: Flyway Migrations

**Files:**
- Create: `packages/pokemon-user-backend-java/src/main/resources/db/migration/V1__create_pokemon.sql`
- Create: `packages/pokemon-user-backend-java/src/main/resources/db/migration/V2__create_profile.sql`
- Create: `packages/pokemon-user-backend-java/src/main/resources/db/migration/V3__create_profile_pokemon.sql`
- Create: `packages/pokemon-user-backend-java/src/main/resources/db/migration/V4__seed_pokemon.sql`

- [ ] **Step 1: Create migration directory**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/resources/db/migration
```

- [ ] **Step 2: Write V1__create_pokemon.sql**

```sql
CREATE TABLE IF NOT EXISTS pokemon (
    id   INTEGER     PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);
```

- [ ] **Step 3: Write V2__create_profile.sql**

```sql
CREATE TABLE IF NOT EXISTS profile (
    id      SERIAL      PRIMARY KEY,
    name    VARCHAR(50) NOT NULL,
    version BIGINT      NOT NULL DEFAULT 0
);
```

- [ ] **Step 4: Write V3__create_profile_pokemon.sql**

```sql
CREATE TABLE IF NOT EXISTS profile_pokemon (
    id         SERIAL  PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profile(id),
    pokemon_id INTEGER NOT NULL REFERENCES pokemon(id)
);
```

- [ ] **Step 5: Write V4__seed_pokemon.sql**

```sql
INSERT INTO pokemon (id, name) VALUES
(1,   'bulbasaur'),
(2,   'ivysaur'),
(3,   'venusaur'),
(4,   'charmander'),
(5,   'charmeleon'),
(6,   'charizard'),
(7,   'squirtle'),
(8,   'wartortle'),
(9,   'blastoise'),
(10,  'caterpie'),
(11,  'metapod'),
(12,  'butterfree'),
(13,  'weedle'),
(14,  'kakuna'),
(15,  'beedrill'),
(16,  'pidgey'),
(17,  'pidgeotto'),
(18,  'pidgeot'),
(19,  'rattata'),
(20,  'raticate'),
(21,  'spearow'),
(22,  'fearow'),
(23,  'ekans'),
(24,  'arbok'),
(25,  'pikachu'),
(26,  'raichu'),
(27,  'sandshrew'),
(28,  'sandslash'),
(29,  'nidoran-f'),
(30,  'nidorina'),
(31,  'nidoqueen'),
(32,  'nidoran-m'),
(33,  'nidorino'),
(34,  'nidoking'),
(35,  'clefairy'),
(36,  'clefable'),
(37,  'vulpix'),
(38,  'ninetales'),
(39,  'jigglypuff'),
(40,  'wigglytuff'),
(41,  'zubat'),
(42,  'golbat'),
(43,  'oddish'),
(44,  'gloom'),
(45,  'vileplume'),
(46,  'paras'),
(47,  'parasect'),
(48,  'venonat'),
(49,  'venomoth'),
(50,  'diglett'),
(51,  'dugtrio'),
(52,  'meowth'),
(53,  'persian'),
(54,  'psyduck'),
(55,  'golduck'),
(56,  'mankey'),
(57,  'primeape'),
(58,  'growlithe'),
(59,  'arcanine'),
(60,  'poliwag'),
(61,  'poliwhirl'),
(62,  'poliwrath'),
(63,  'abra'),
(64,  'kadabra'),
(65,  'alakazam'),
(66,  'machop'),
(67,  'machoke'),
(68,  'machamp'),
(69,  'bellsprout'),
(70,  'weepinbell'),
(71,  'victreebel'),
(72,  'tentacool'),
(73,  'tentacruel'),
(74,  'geodude'),
(75,  'graveler'),
(76,  'golem'),
(77,  'ponyta'),
(78,  'rapidash'),
(79,  'slowpoke'),
(80,  'slowbro'),
(81,  'magnemite'),
(82,  'magneton'),
(83,  'farfetch-d'),
(84,  'doduo'),
(85,  'dodrio'),
(86,  'seel'),
(87,  'dewgong'),
(88,  'grimer'),
(89,  'muk'),
(90,  'shellder'),
(91,  'cloyster'),
(92,  'gastly'),
(93,  'haunter'),
(94,  'gengar'),
(95,  'onix'),
(96,  'drowzee'),
(97,  'hypno'),
(98,  'krabby'),
(99,  'kingler'),
(100, 'voltorb'),
(101, 'electrode'),
(102, 'exeggcute'),
(103, 'exeggutor'),
(104, 'cubone'),
(105, 'marowak'),
(106, 'hitmonlee'),
(107, 'hitmonchan'),
(108, 'lickitung'),
(109, 'koffing'),
(110, 'weezing'),
(111, 'rhyhorn'),
(112, 'rhydon'),
(113, 'chansey'),
(114, 'tangela'),
(115, 'kangaskhan'),
(116, 'horsea'),
(117, 'seadra'),
(118, 'goldeen'),
(119, 'seaking'),
(120, 'staryu'),
(121, 'starmie'),
(122, 'mr-mime'),
(123, 'scyther'),
(124, 'jynx'),
(125, 'electabuzz'),
(126, 'magmar'),
(127, 'pinsir'),
(128, 'tauros'),
(129, 'magikarp'),
(130, 'gyarados'),
(131, 'lapras'),
(132, 'ditto'),
(133, 'eevee'),
(134, 'vaporeon'),
(135, 'jolteon'),
(136, 'flareon'),
(137, 'porygon'),
(138, 'omanyte'),
(139, 'omastar'),
(140, 'kabuto'),
(141, 'kabutops'),
(142, 'aerodactyl'),
(143, 'snorlax'),
(144, 'articuno'),
(145, 'zapdos'),
(146, 'moltres'),
(147, 'dratini'),
(148, 'dragonair'),
(149, 'dragonite'),
(150, 'mewtwo');
```

Names use PokeAPI's lowercase slug convention — the frontend uses these IDs to derive sprite URLs via the PokeAPI CDN pattern.

- [ ] **Step 6: Run contextLoads test — Flyway migrations run on H2**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected:
```
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

If Flyway fails, check H2 SQL compatibility. H2 with `MODE=PostgreSQL` supports `SERIAL` and `REFERENCES`. If you see "Syntax error", add `NON_KEYWORDS=VALUE` to the H2 URL in `src/test/resources/application.properties`.

- [ ] **Step 7: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/resources/db/
git commit -m "feat: add Flyway migrations V1-V4 with schema and 150 Pokemon seed"
```

---

### Task 3: JPA Entities

**Files:**
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity/Pokemon.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity/Profile.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity/ProfilePokemon.java`

JPA entities must be mutable classes with a no-args constructor — Java records cannot be used here.

- [ ] **Step 1: Create entity package directory**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity
```

- [ ] **Step 2: Write Pokemon.java**

```java
package com.pokemon.userbackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pokemon")
public class Pokemon {

    @Id
    private Integer id;

    @Column(nullable = false)
    private String name;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

`@Id` with no `@GeneratedValue` — Pokédex IDs are seeded by Flyway, not auto-generated.

- [ ] **Step 3: Write Profile.java**

```java
package com.pokemon.userbackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "profile")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Version
    private Long version;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
```

`@Version` tells JPA to include `version` in every UPDATE's WHERE clause (`WHERE id = ? AND version = ?`). If the version in the DB differs from what was read, JPA throws `OptimisticLockException`. Spring translates this to `ObjectOptimisticLockingFailureException`.

- [ ] **Step 4: Write ProfilePokemon.java**

```java
package com.pokemon.userbackend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "profile_pokemon")
public class ProfilePokemon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @ManyToOne
    @JoinColumn(name = "pokemon_id", nullable = false)
    private Pokemon pokemon;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Profile getProfile() { return profile; }
    public void setProfile(Profile profile) { this.profile = profile; }
    public Pokemon getPokemon() { return pokemon; }
    public void setPokemon(Pokemon pokemon) { this.pokemon = pokemon; }
}
```

- [ ] **Step 5: Run contextLoads — Hibernate validates entities against schema**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected: `BUILD SUCCESS`. With `ddl-auto=none` in test properties, Hibernate skips validation against H2. If you're running against a real PostgreSQL (not in tests), `ddl-auto=validate` confirms the entity mappings match the Flyway-created schema.

- [ ] **Step 6: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/entity/
git commit -m "feat: add JPA entities Pokemon, Profile, ProfilePokemon"
```

---

### Task 4: Repositories

**Files:**
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository/PokemonRepository.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository/ProfileRepository.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository/ProfilePokemonRepository.java`

- [ ] **Step 1: Create repository package**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository
```

- [ ] **Step 2: Write PokemonRepository.java**

```java
package com.pokemon.userbackend.repository;

import com.pokemon.userbackend.entity.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PokemonRepository extends JpaRepository<Pokemon, Integer> {
}
```

- [ ] **Step 3: Write ProfileRepository.java**

```java
package com.pokemon.userbackend.repository;

import com.pokemon.userbackend.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Integer> {
}
```

- [ ] **Step 4: Write ProfilePokemonRepository.java**

```java
package com.pokemon.userbackend.repository;

import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProfilePokemonRepository extends JpaRepository<ProfilePokemon, Integer> {

    List<ProfilePokemon> findByProfile(Profile profile);

    @Transactional
    void deleteByProfile(Profile profile);
}
```

`deleteByProfile` requires `@Transactional` on derived delete methods in Spring Data JPA — without it, Spring throws `TransactionRequiredException` at runtime.

- [ ] **Step 5: Run contextLoads**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected: `BUILD SUCCESS`

- [ ] **Step 6: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/repository/
git commit -m "feat: add Spring Data JPA repositories"
```

---

### Task 5: DTOs and ErrorResponse

**Files:**
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/PokemonDto.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/ProfileDto.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/CreateProfileRequest.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/UpdateTeamRequest.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/ErrorResponse.java`

- [ ] **Step 1: Create dto package**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto
```

- [ ] **Step 2: Write PokemonDto.java**

```java
package com.pokemon.userbackend.dto;

public record PokemonDto(Integer id, String name) {
}
```

- [ ] **Step 3: Write ProfileDto.java**

```java
package com.pokemon.userbackend.dto;

import java.util.List;

public record ProfileDto(Integer id, String name, List<PokemonDto> pokemon) {
}
```

- [ ] **Step 4: Write CreateProfileRequest.java**

```java
package com.pokemon.userbackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateProfileRequest(@NotBlank String name) {
}
```

`@NotBlank` triggers Bean Validation when the controller uses `@Valid`. Spring returns 400 with `MethodArgumentNotValidException` if `name` is null, empty, or whitespace-only.

- [ ] **Step 5: Write UpdateTeamRequest.java**

```java
package com.pokemon.userbackend.dto;

import java.util.List;

public record UpdateTeamRequest(List<Integer> pokemonIds) {
}
```

The ≤ 6 validation is enforced in `ProfileService`, not via Bean Validation, because the spec defines a custom `TeamSizeExceededException` for this case.

- [ ] **Step 6: Write ErrorResponse.java**

```java
package com.pokemon.userbackend.dto;

public record ErrorResponse(int status, String message) {
}
```

- [ ] **Step 7: Run contextLoads**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected: `BUILD SUCCESS`

- [ ] **Step 8: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/dto/
git commit -m "feat: add DTO records and ErrorResponse"
```

---

### Task 6: Mappers

**Files:**
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/mapper/PokemonMapper.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/mapper/ProfileMapper.java`
- Test: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/mapper/PokemonMapperTest.java`
- Test: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/mapper/ProfileMapperTest.java`

- [ ] **Step 1: Create mapper and test packages**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/mapper
mkdir -p packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/mapper
```

- [ ] **Step 2: Write failing PokemonMapperTest.java**

```java
package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.entity.Pokemon;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonMapperTest {

    private final PokemonMapper mapper = new PokemonMapper();

    @Test
    void toDto_mapsIdAndName() {
        var entity = new Pokemon();
        entity.setId(25);
        entity.setName("pikachu");

        var dto = mapper.toDto(entity);

        assertThat(dto.id()).isEqualTo(25);
        assertThat(dto.name()).isEqualTo("pikachu");
    }
}
```

- [ ] **Step 3: Run test — verify it fails**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=PokemonMapperTest
```

Expected: `BUILD FAILURE` — `cannot find symbol: class PokemonMapper`

- [ ] **Step 4: Write PokemonMapper.java**

```java
package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.entity.Pokemon;
import org.springframework.stereotype.Component;

@Component
public class PokemonMapper {

    public PokemonDto toDto(Pokemon pokemon) {
        return new PokemonDto(pokemon.getId(), pokemon.getName());
    }
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=PokemonMapperTest
```

Expected:
```
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 6: Write failing ProfileMapperTest.java**

```java
package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.entity.Pokemon;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileMapperTest {

    private ProfileMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ProfileMapper(new PokemonMapper());
    }

    @Test
    void toDto_withNoTeam_returnsEmptyPokemonList() {
        var profile = new Profile();
        profile.setId(1);
        profile.setName("ash");

        var dto = mapper.toDto(profile);

        assertThat(dto.id()).isEqualTo(1);
        assertThat(dto.name()).isEqualTo("ash");
        assertThat(dto.pokemon()).isEmpty();
    }

    @Test
    void toDto_withTeam_mapsPokemon() {
        var profile = new Profile();
        profile.setId(1);
        profile.setName("ash");

        var bulbasaur = new Pokemon();
        bulbasaur.setId(1);
        bulbasaur.setName("bulbasaur");

        var pp = new ProfilePokemon();
        pp.setProfile(profile);
        pp.setPokemon(bulbasaur);

        var dto = mapper.toDto(profile, List.of(pp));

        assertThat(dto.pokemon()).hasSize(1);
        assertThat(dto.pokemon().get(0).id()).isEqualTo(1);
        assertThat(dto.pokemon().get(0).name()).isEqualTo("bulbasaur");
    }
}
```

- [ ] **Step 7: Run test — verify it fails**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=ProfileMapperTest
```

Expected: `BUILD FAILURE` — `cannot find symbol: class ProfileMapper`

- [ ] **Step 8: Write ProfileMapper.java**

```java
package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProfileMapper {

    private final PokemonMapper pokemonMapper;

    public ProfileMapper(PokemonMapper pokemonMapper) {
        this.pokemonMapper = pokemonMapper;
    }

    public ProfileDto toDto(Profile profile) {
        return toDto(profile, List.of());
    }

    public ProfileDto toDto(Profile profile, List<ProfilePokemon> team) {
        List<PokemonDto> pokemon = team.stream()
                .map(pp -> pokemonMapper.toDto(pp.getPokemon()))
                .toList();
        return new ProfileDto(profile.getId(), profile.getName(), pokemon);
    }
}
```

- [ ] **Step 9: Run all tests**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected:
```
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 10: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/mapper/ \
        packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/mapper/
git commit -m "feat: add PokemonMapper and ProfileMapper with tests"
```

---

### Task 7: Exceptions and GlobalExceptionHandler

**Files:**
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception/ResourceNotFoundException.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception/TeamSizeExceededException.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception/GlobalExceptionHandler.java`

These classes are straightforward; their behavior is tested through controller tests in Tasks 8–10.

- [ ] **Step 1: Create exception package**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception
```

- [ ] **Step 2: Write ResourceNotFoundException.java**

```java
package com.pokemon.userbackend.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

- [ ] **Step 3: Write TeamSizeExceededException.java**

```java
package com.pokemon.userbackend.exception;

public class TeamSizeExceededException extends RuntimeException {
    public TeamSizeExceededException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Write GlobalExceptionHandler.java**

```java
package com.pokemon.userbackend.exception;

import com.pokemon.userbackend.dto.ErrorResponse;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, ex.getMessage()));
    }

    @ExceptionHandler(TeamSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleTeamSize(TeamSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, ex.getMessage()));
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(OptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(409, "Concurrent update conflict — please retry"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, message));
    }
}
```

`@RestControllerAdvice` combines `@ControllerAdvice` and `@ResponseBody`. `OptimisticLockingFailureException` (from `org.springframework.dao`) is the Spring-translated form of JPA's `OptimisticLockException` — Spring Data repositories always translate persistence exceptions to Spring's hierarchy.

- [ ] **Step 5: Run all tests**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected: `BUILD SUCCESS`

- [ ] **Step 6: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/exception/
git commit -m "feat: add domain exceptions and GlobalExceptionHandler"
```

---

### Task 8: PokemonService + PokemonController (TDD)

**Files:**
- Create: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/PokemonServiceTest.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/PokemonService.java`
- Create: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/PokemonControllerTest.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/PokemonController.java`

**Note on MockMvc paths:** `@WebMvcTest` creates a mock servlet WITHOUT applying `server.servlet.context-path`. Test paths do not include `/api`. A controller at `@GetMapping("/pokemon")` is reached by `get("/pokemon")` in MockMvc, but at `GET /api/pokemon` in the real server.

- [ ] **Step 1: Create service and controller packages**

```bash
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service
mkdir -p packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller
mkdir -p packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service
mkdir -p packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller
```

- [ ] **Step 2: Write failing PokemonServiceTest.java**

```java
package com.pokemon.userbackend.service;

import com.pokemon.userbackend.entity.Pokemon;
import com.pokemon.userbackend.mapper.PokemonMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PokemonServiceTest {

    @Mock
    private PokemonRepository pokemonRepository;

    private PokemonService pokemonService;

    @BeforeEach
    void setUp() {
        pokemonService = new PokemonService(pokemonRepository, new PokemonMapper());
    }

    @Test
    void findAll_returnsMappedDtos() {
        var bulbasaur = new Pokemon();
        bulbasaur.setId(1);
        bulbasaur.setName("bulbasaur");
        when(pokemonRepository.findAll()).thenReturn(List.of(bulbasaur));

        var result = pokemonService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1);
        assertThat(result.get(0).name()).isEqualTo("bulbasaur");
    }

    @Test
    void findAll_returnsEmptyListWhenNoPokemon() {
        when(pokemonRepository.findAll()).thenReturn(List.of());

        var result = pokemonService.findAll();

        assertThat(result).isEmpty();
    }
}
```

- [ ] **Step 3: Run test — verify it fails**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=PokemonServiceTest
```

Expected: `BUILD FAILURE` — `cannot find symbol: class PokemonService`

- [ ] **Step 4: Write PokemonService.java**

```java
package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.mapper.PokemonMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PokemonService {

    private final PokemonRepository pokemonRepository;
    private final PokemonMapper pokemonMapper;

    public PokemonService(PokemonRepository pokemonRepository, PokemonMapper pokemonMapper) {
        this.pokemonRepository = pokemonRepository;
        this.pokemonMapper = pokemonMapper;
    }

    public List<PokemonDto> findAll() {
        return pokemonRepository.findAll().stream()
                .map(pokemonMapper::toDto)
                .toList();
    }
}
```

- [ ] **Step 5: Run service test — verify it passes**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=PokemonServiceTest
```

Expected:
```
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 6: Write failing PokemonControllerTest.java**

```java
package com.pokemon.userbackend.controller;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.service.PokemonService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PokemonController.class)
class PokemonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PokemonService pokemonService;

    @Test
    void getPokemon_returns200WithList() throws Exception {
        when(pokemonService.findAll()).thenReturn(List.of(
                new PokemonDto(1, "bulbasaur"),
                new PokemonDto(25, "pikachu")
        ));

        mockMvc.perform(get("/pokemon"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("bulbasaur"))
                .andExpect(jsonPath("$[1].id").value(25));
    }

    @Test
    void getPokemon_returns200WithEmptyList() throws Exception {
        when(pokemonService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/pokemon"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
```

- [ ] **Step 7: Run controller test — verify it fails**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=PokemonControllerTest
```

Expected: `BUILD FAILURE` — `cannot find symbol: class PokemonController`

- [ ] **Step 8: Write PokemonController.java**

```java
package com.pokemon.userbackend.controller;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.service.PokemonService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/pokemon")
public class PokemonController {

    private final PokemonService pokemonService;

    public PokemonController(PokemonService pokemonService) {
        this.pokemonService = pokemonService;
    }

    @GetMapping
    public List<PokemonDto> getPokemon() {
        return pokemonService.findAll();
    }
}
```

- [ ] **Step 9: Run all tests**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected:
```
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 10: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/PokemonService.java \
        packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/PokemonController.java \
        packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/PokemonServiceTest.java \
        packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/PokemonControllerTest.java
git commit -m "feat: implement GET /api/pokemon with service and controller (TDD)"
```

---

### Task 9: Profile List + Create (TDD)

**Files:**
- Create: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/ProfileServiceTest.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/ProfileService.java`
- Create: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/ProfileControllerTest.java`
- Create: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/ProfileController.java`

This task covers `GET /profiles` and `POST /profiles`. Task 10 adds `GET /profiles/{id}` and `PUT /profiles/{id}/team`.

- [ ] **Step 1: Write failing ProfileServiceTest.java (findAll + create)**

```java
package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.mapper.PokemonMapper;
import com.pokemon.userbackend.mapper.ProfileMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import com.pokemon.userbackend.repository.ProfilePokemonRepository;
import com.pokemon.userbackend.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private PokemonRepository pokemonRepository;
    @Mock
    private ProfilePokemonRepository profilePokemonRepository;

    private ProfileService profileService;

    @BeforeEach
    void setUp() {
        var profileMapper = new ProfileMapper(new PokemonMapper());
        profileService = new ProfileService(
                profileRepository, pokemonRepository, profilePokemonRepository, profileMapper);
    }

    @Test
    void findAll_returnsDtoList() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        when(profileRepository.findAll()).thenReturn(List.of(ash));

        var result = profileService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1);
        assertThat(result.get(0).name()).isEqualTo("ash");
        assertThat(result.get(0).pokemon()).isEmpty();
    }

    @Test
    void create_savesAndReturnsDtoWithEmptyTeam() {
        var saved = new Profile();
        saved.setId(1);
        saved.setName("ash");
        when(profileRepository.save(any(Profile.class))).thenReturn(saved);

        var result = profileService.create(new CreateProfileRequest("ash"));

        assertThat(result.id()).isEqualTo(1);
        assertThat(result.name()).isEqualTo("ash");
        assertThat(result.pokemon()).isEmpty();
    }
}
```

- [ ] **Step 2: Run test — verify it fails**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=ProfileServiceTest
```

Expected: `BUILD FAILURE` — `cannot find symbol: class ProfileService`

- [ ] **Step 3: Write ProfileService.java (findAll + create only)**

```java
package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.mapper.ProfileMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import com.pokemon.userbackend.repository.ProfilePokemonRepository;
import com.pokemon.userbackend.repository.ProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final PokemonRepository pokemonRepository;
    private final ProfilePokemonRepository profilePokemonRepository;
    private final ProfileMapper profileMapper;

    public ProfileService(ProfileRepository profileRepository,
                          PokemonRepository pokemonRepository,
                          ProfilePokemonRepository profilePokemonRepository,
                          ProfileMapper profileMapper) {
        this.profileRepository = profileRepository;
        this.pokemonRepository = pokemonRepository;
        this.profilePokemonRepository = profilePokemonRepository;
        this.profileMapper = profileMapper;
    }

    public List<ProfileDto> findAll() {
        return profileRepository.findAll().stream()
                .map(profileMapper::toDto)
                .toList();
    }

    public ProfileDto create(CreateProfileRequest request) {
        var profile = new Profile();
        profile.setName(request.name());
        var saved = profileRepository.save(profile);
        return profileMapper.toDto(saved);
    }
}
```

- [ ] **Step 4: Run service test — verify it passes**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=ProfileServiceTest
```

Expected:
```
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: Write failing ProfileControllerTest.java (list + create)**

```java
package com.pokemon.userbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfileController.class)
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProfileService profileService;

    @Test
    void getProfiles_returns200WithList() throws Exception {
        when(profileService.findAll()).thenReturn(List.of(
                new ProfileDto(1, "ash", List.of())
        ));

        mockMvc.perform(get("/profiles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("ash"));
    }

    @Test
    void createProfile_returns201WithDto() throws Exception {
        when(profileService.create(new CreateProfileRequest("ash")))
                .thenReturn(new ProfileDto(1, "ash", List.of()));

        mockMvc.perform(post("/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"ash\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("ash"));
    }

    @Test
    void createProfile_returns400WhenNameIsBlank() throws Exception {
        mockMvc.perform(post("/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
```

- [ ] **Step 6: Run controller test — verify it fails**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=ProfileControllerTest
```

Expected: `BUILD FAILURE` — `cannot find symbol: class ProfileController`

- [ ] **Step 7: Write ProfileController.java (list + create)**

```java
package com.pokemon.userbackend.controller;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public List<ProfileDto> getProfiles() {
        return profileService.findAll();
    }

    @PostMapping
    public ResponseEntity<ProfileDto> createProfile(@Valid @RequestBody CreateProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.create(request));
    }
}
```

- [ ] **Step 8: Run all tests**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected:
```
Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 9: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/ProfileService.java \
        packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/ProfileController.java \
        packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/ProfileServiceTest.java \
        packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/ProfileControllerTest.java
git commit -m "feat: implement GET /api/profiles and POST /api/profiles (TDD)"
```

---

### Task 10: Profile Get + Update Team (TDD)

**Files:**
- Modify: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/ProfileServiceTest.java`
- Modify: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/ProfileService.java`
- Modify: `packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/ProfileControllerTest.java`
- Modify: `packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/ProfileController.java`

- [ ] **Step 1: Add failing tests to ProfileServiceTest.java**

Add these test methods to the existing `ProfileServiceTest` class (inside the class body, after the `create` test):

```java
    @Test
    void getById_returnsProfileWithTeam() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        when(profileRepository.findById(1)).thenReturn(java.util.Optional.of(ash));
        when(profilePokemonRepository.findByProfile(ash)).thenReturn(List.of());

        var result = profileService.getById(1);

        assertThat(result.id()).isEqualTo(1);
        assertThat(result.name()).isEqualTo("ash");
        assertThat(result.pokemon()).isEmpty();
    }

    @Test
    void getById_throwsWhenNotFound() {
        when(profileRepository.findById(99)).thenReturn(java.util.Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.getById(99))
                .isInstanceOf(com.pokemon.userbackend.exception.ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void updateTeam_throwsWhenMoreThanSixPokemon() {
        var ids = List.of(1, 2, 3, 4, 5, 6, 7);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.updateTeam(1, ids))
                .isInstanceOf(com.pokemon.userbackend.exception.TeamSizeExceededException.class);
    }

    @Test
    void updateTeam_throwsWhenProfileNotFound() {
        when(profileRepository.findById(99)).thenReturn(java.util.Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.updateTeam(99, List.of(1)))
                .isInstanceOf(com.pokemon.userbackend.exception.ResourceNotFoundException.class);
    }

    @Test
    void updateTeam_throwsWhenPokemonIdNotFound() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        when(profileRepository.findById(1)).thenReturn(java.util.Optional.of(ash));
        when(pokemonRepository.findAllById(List.of(999))).thenReturn(List.of());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.updateTeam(1, List.of(999)))
                .isInstanceOf(com.pokemon.userbackend.exception.ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void updateTeam_replacesTeamAndReturnsDto() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        var bulbasaur = new com.pokemon.userbackend.entity.Pokemon();
        bulbasaur.setId(1);
        bulbasaur.setName("bulbasaur");

        when(profileRepository.findById(1)).thenReturn(java.util.Optional.of(ash));
        when(pokemonRepository.findAllById(List.of(1))).thenReturn(List.of(bulbasaur));
        when(profilePokemonRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = profileService.updateTeam(1, List.of(1));

        assertThat(result.id()).isEqualTo(1);
        assertThat(result.pokemon()).hasSize(1);
        assertThat(result.pokemon().get(0).id()).isEqualTo(1);
        assertThat(result.pokemon().get(0).name()).isEqualTo("bulbasaur");

        org.mockito.Mockito.verify(profilePokemonRepository).deleteByProfile(ash);
    }
```

- [ ] **Step 2: Run tests — verify new tests fail**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=ProfileServiceTest
```

Expected: `BUILD FAILURE` — `cannot find symbol: method getById(int)` / `cannot find symbol: method updateTeam(...)`

- [ ] **Step 3: Add getById and updateTeam to ProfileService.java**

Add these imports to `ProfileService.java`:
```java
import com.pokemon.userbackend.entity.Pokemon;
import com.pokemon.userbackend.entity.ProfilePokemon;
import com.pokemon.userbackend.exception.ResourceNotFoundException;
import com.pokemon.userbackend.exception.TeamSizeExceededException;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;
```

Add these methods to the `ProfileService` class body:

```java
    public ProfileDto getById(Integer id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + id));
        List<ProfilePokemon> team = profilePokemonRepository.findByProfile(profile);
        return profileMapper.toDto(profile, team);
    }

    @Transactional
    public ProfileDto updateTeam(Integer profileId, List<Integer> pokemonIds) {
        if (pokemonIds.size() > 6) {
            throw new TeamSizeExceededException("Team cannot have more than 6 Pokémon");
        }

        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));

        List<Integer> uniqueIds = pokemonIds.stream().distinct().toList();
        List<Pokemon> found = pokemonRepository.findAllById(uniqueIds);
        if (found.size() != uniqueIds.size()) {
            List<Integer> foundIds = found.stream().map(Pokemon::getId).toList();
            List<Integer> missing = uniqueIds.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ResourceNotFoundException("Pokémon IDs not found: " + missing);
        }

        Map<Integer, Pokemon> pokemonById = found.stream()
                .collect(Collectors.toMap(Pokemon::getId, p -> p));

        profilePokemonRepository.deleteByProfile(profile);

        List<ProfilePokemon> team = pokemonIds.stream()
                .map(id -> {
                    var pp = new ProfilePokemon();
                    pp.setProfile(profile);
                    pp.setPokemon(pokemonById.get(id));
                    return pp;
                })
                .toList();
        List<ProfilePokemon> savedTeam = profilePokemonRepository.saveAll(team);

        profileRepository.save(profile);

        return profileMapper.toDto(profile, savedTeam);
    }
```

The `uniqueIds` check ensures all requested IDs exist before proceeding. `pokemonIds` (with potential duplicates) drives the final team — allowing the same Pokémon twice as per spec. `profileRepository.save(profile)` triggers a `WHERE id = ? AND version = ?` UPDATE, causing `OptimisticLockingFailureException` if a concurrent transaction already committed a team update.

- [ ] **Step 4: Run service tests — verify all pass**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=ProfileServiceTest
```

Expected:
```
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: Add failing controller tests for getById and updateTeam**

Add these imports to `ProfileControllerTest.java`:
```java
import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.dto.UpdateTeamRequest;
import com.pokemon.userbackend.exception.ResourceNotFoundException;
import com.pokemon.userbackend.exception.TeamSizeExceededException;
import org.springframework.dao.OptimisticLockingFailureException;

import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
```

Add these test methods to `ProfileControllerTest`:

```java
    @Test
    void getProfile_returns200WithTeam() throws Exception {
        when(profileService.getById(1)).thenReturn(
                new ProfileDto(1, "ash", List.of(new PokemonDto(1, "bulbasaur")))
        );

        mockMvc.perform(get("/profiles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("ash"))
                .andExpect(jsonPath("$.pokemon.length()").value(1))
                .andExpect(jsonPath("$.pokemon[0].name").value("bulbasaur"));
    }

    @Test
    void getProfile_returns404WhenNotFound() throws Exception {
        when(profileService.getById(99))
                .thenThrow(new ResourceNotFoundException("Profile not found: 99"));

        mockMvc.perform(get("/profiles/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Profile not found: 99"));
    }

    @Test
    void updateTeam_returns200WithUpdatedTeam() throws Exception {
        when(profileService.updateTeam(eq(1), any())).thenReturn(
                new ProfileDto(1, "ash", List.of(
                        new PokemonDto(1, "bulbasaur"),
                        new PokemonDto(4, "charmander")
                ))
        );

        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [1, 4]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pokemon.length()").value(2))
                .andExpect(jsonPath("$.pokemon[0].id").value(1))
                .andExpect(jsonPath("$.pokemon[1].id").value(4));
    }

    @Test
    void updateTeam_returns400WhenMoreThanSixPokemon() throws Exception {
        when(profileService.updateTeam(eq(1), any()))
                .thenThrow(new TeamSizeExceededException("Team cannot have more than 6 Pokémon"));

        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [1,2,3,4,5,6,7]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateTeam_returns404WhenPokemonNotFound() throws Exception {
        when(profileService.updateTeam(eq(1), any()))
                .thenThrow(new ResourceNotFoundException("Pokémon IDs not found: [999]"));

        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [999]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateTeam_returns409OnConcurrentUpdate() throws Exception {
        when(profileService.updateTeam(eq(1), any()))
                .thenThrow(new OptimisticLockingFailureException("version conflict"));

        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [1]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }
```

Also add `import static org.mockito.ArgumentMatchers.any;` if not already present.

- [ ] **Step 6: Run controller tests — verify new ones fail**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml \
    -Dtest=ProfileControllerTest
```

Expected: `BUILD FAILURE` — `No handler found for GET /profiles/1` (controller lacks the new endpoints)

- [ ] **Step 7: Add getById and updateTeam to ProfileController.java**

Add these imports to `ProfileController.java`:
```java
import com.pokemon.userbackend.dto.UpdateTeamRequest;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
```

Add these methods to the `ProfileController` class body:

```java
    @GetMapping("/{id}")
    public ProfileDto getProfile(@PathVariable Integer id) {
        return profileService.getById(id);
    }

    @PutMapping("/{id}/team")
    public ProfileDto updateTeam(@PathVariable Integer id, @RequestBody UpdateTeamRequest request) {
        return profileService.updateTeam(id, request.pokemonIds());
    }
```

- [ ] **Step 8: Run all tests**

```bash
mvn test -f packages/pokemon-user-backend-java/pom.xml
```

Expected:
```
Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 9: Commit**

```bash
git add packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/service/ProfileService.java \
        packages/pokemon-user-backend-java/src/main/java/com/pokemon/userbackend/controller/ProfileController.java \
        packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/service/ProfileServiceTest.java \
        packages/pokemon-user-backend-java/src/test/java/com/pokemon/userbackend/controller/ProfileControllerTest.java
git commit -m "feat: implement GET /api/profiles/{id} and PUT /api/profiles/{id}/team (TDD)"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| `GET /api/pokemon` | Task 8 |
| `GET /api/profiles` | Task 9 |
| `POST /api/profiles` | Task 9 |
| `GET /api/profiles/{id}` | Task 10 |
| `PUT /api/profiles/{id}/team` | Task 10 |
| Flyway V1–V4 migrations | Task 2 |
| `@Version` optimistic lock | Task 3 (entity), Task 10 (service + test) |
| ≤ 6 Pokémon validation | Task 10 (service + controller test) |
| 404 on unknown profile/Pokémon | Task 10 (service + controller test) |
| 409 on concurrent update | Task 10 (controller test) |
| 400 on blank profile name | Task 9 (controller test) |
| Error response `{ status, message }` | Task 5, Task 7 |
| Global prefix `/api` | Task 1 (context-path property) |
| H2 in-memory for tests | Task 1 |

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:**
- `PokemonDto(Integer id, String name)` — used consistently in Tasks 5, 6, 8, 9, 10
- `ProfileDto(Integer id, String name, List<PokemonDto> pokemon)` — used consistently
- `ProfileMapper.toDto(Profile, List<ProfilePokemon>)` defined in Task 6, called in Task 10
- `ProfileService.updateTeam(Integer profileId, List<Integer> pokemonIds)` defined and tested in Task 10
- `ProfileController.updateTeam` calls `profileService.updateTeam(id, request.pokemonIds())` — matches service signature
