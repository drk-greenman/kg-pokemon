FROM maven:3-eclipse-temurin-25-alpine

WORKDIR /app

# Resolve dependencies as a separate layer — cached unless pom.xml changes
COPY packages/pokemon-user-backend-java/pom.xml ./pom.xml
RUN mvn dependency:resolve -q

COPY packages/pokemon-user-backend-java/src ./src

CMD ["mvn", "spring-boot:run"]
