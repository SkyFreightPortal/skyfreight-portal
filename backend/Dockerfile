FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S skyfreight && adduser -S skyfreight -G skyfreight
COPY --from=build /app/target/*.jar app.jar
USER skyfreight
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
