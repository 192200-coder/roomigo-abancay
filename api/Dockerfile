# ==============================================================================
# ROOMIGO ABANCAY - DOCKERFILE FOR RENDER.COM & PRODUCTION
# Multi-stage build para Spring Boot 3.3.4 (Java 17)
# ==============================================================================

# Paso 1: Etapa de Compilación con Maven y Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build

# Copiar descriptor de dependencias para aprovechar la caché de capas Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente y compilar el JAR de producción sin ejecutar tests
COPY src ./src
RUN mvn clean package -DskipTests -B

# Paso 2: Imagen Ligera de Ejecución (JRE 17 Alpine/Jammy)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Crear usuario sin privilegios por seguridad
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copiar el artefacto empaquetado desde la etapa de construcción
COPY --from=builder /build/target/*.jar app.jar

# Render asigna dinámicamente la variable de entorno PORT (por defecto 10000 o 8081)
ENV PORT=8081
EXPOSE 8081 10000

# Flags de JVM optimizados para contenedores y compatibilidad IPv4 con Supabase Pooler
ENTRYPOINT ["sh", "-c", "java -Djava.net.preferIPv4Stack=true -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar app.jar"]
