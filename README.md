# 🏠 Roomix - Plataforma de Alquiler de Cuartos y Departamentos (Abancay, Apurímac)

Plataforma web integral para la búsqueda, publicación y gestión de habitaciones y alojamientos en la ciudad de **Abancay, Apurímac - Perú**.

---

## 🚀 Tecnologías

### Backend (API REST)
* **Framework:** Java 25 + Spring Boot 4.0.6
* **Seguridad:** Spring Security 7 + JSON Web Tokens (JWT)
* **Persistencia:** Spring Data JPA + Hibernate + PostgreSQL
* **Migraciones:** Flyway (`api/src/main/resources/db/migration`)
* **Documentación:** OpenAPI 3 / Swagger UI (`/swagger-ui.html`)
* **Validación:** Jakarta Bean Validation

### Frontend (SPA)
* **Framework:** Angular 21 (Componentes Standalone & Signals)
* **Estilos:** CSS3 Moderno con variables CSS, glassmorphism y diseño responsivo
* **Iconos:** FontAwesome 6

---

## 📁 Estructura del Proyecto

```text
├── api/                       # Backend Spring Boot (REST API en puerto 8081)
│   ├── src/main/java/         # Controllers, services, entities, security, etc.
│   ├── src/main/resources/    # application.properties y migraciones Flyway
│   ├── docker-compose.yml     # PostgreSQL local para desarrollo
│   ├── .env.example           # Plantilla de variables locales (copiar a .env)
│   └── pom.xml                # Configuración Maven
├── frontend/                  # Frontend Angular (Dev Server en puerto 4200)
│   ├── src/app/               # Componentes, vistas y servicios Angular
│   ├── package.json           # Dependencias Node.js
│   └── angular.json           # Configuración Angular CLI
└── .gitignore
```

---

## 🛠️ Cómo Ejecutar el Proyecto

### Requisitos
* **JDK 25** (por ejemplo `winget install EclipseAdoptium.Temurin.25.JDK`). No hace falta instalar Maven: se usa el wrapper `mvnw`.
* **Node.js 24+** y npm.
* **Docker Desktop** (para la base de datos local).

### 1. Variables locales
```powershell
cd api
Copy-Item .env.example .env
```
Completa `api/.env`. Como mínimo: `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET` y
`APP_ADMIN_INITIAL_PASSWORD` (sin esta última el backend no arranca la primera vez).
Spring Boot y docker compose leen ese archivo automáticamente. **Nunca lo subas a git** (ya está ignorado).

### 2. Base de datos (PostgreSQL en Docker)
```powershell
cd api
docker compose up -d
```
Levanta PostgreSQL 17 en `127.0.0.1:5432` con la base `roomix_db`. Al arrancar el backend,
**Flyway crea el esquema** automáticamente; Hibernate solo lo valida (`ddl-auto=validate`).

Para usar Supabase en lugar de la base local, define `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME` y `SPRING_DATASOURCE_PASSWORD` en `api/.env`.

### 3. Backend (Spring Boot)
```powershell
cd api
.\mvnw.cmd spring-boot:run
```
* API disponible en: `http://localhost:8081/api/v1`
* Documentación Swagger: `http://localhost:8081/swagger-ui.html`
* Tests: `.\mvnw.cmd test` (usan H2 en memoria; no requieren PostgreSQL)

### 4. Frontend (Angular)
```bash
cd frontend
npm install
npm start
```
* Aplicación web disponible en: `http://localhost:4200`

---

## 💳 Pagos con Mercado Pago (Checkout Pro)

**Qué se cobra:**
* **Reserva:** primer mes + depósito, después de que el propietario la aprueba. Al acreditarse, el cuarto pasa a *Alquilado*.
* **Publicación:** tarifa del cuarto (S/ 15 por defecto), desde *Mis inmuebles*.

**Cómo funciona:** el backend crea la preferencia y el usuario paga en la página de Mercado Pago
(Yape, tarjetas, PagoEfectivo). Roomix **nunca recibe datos de tarjeta**. El pago se confirma por dos vías,
ambas consultando la API de Mercado Pago antes de aplicarlo y sin procesar dos veces el mismo pago:
1. Al volver el comprador (`/?pago=resultado`), el frontend llama a `GET /api/v1/payments/mercadopago/confirm`.
2. El webhook `POST /api/v1/payments/mercadopago/webhook` (firma `x-signature` validada con `MP_WEBHOOK_SECRET`).

**Probar en local** (Mercado Pago necesita URLs públicas HTTPS):
1. En `api/.env` define `MP_ACCESS_TOKEN` (cuenta **vendedora de prueba**), `MP_WEBHOOK_SECRET`,
   `MP_BACK_URL_BASE=https://<tu-dominio>.ngrok-free.dev` y
   `MP_WEBHOOK_URL=https://<tu-dominio>.ngrok-free.dev/api/v1/payments/mercadopago/webhook`.
2. Levanta backend y frontend (`ng serve` reenvía `/api` al backend con `proxy.conf.mjs`).
3. Abre el túnel hacia el **frontend**: `ngrok http --url=<tu-dominio>.ngrok-free.dev 4200`.
4. Entra a la app **por la URL de ngrok** (no por `localhost`, porque la sesión se guarda por dominio) y paga
   con una **cuenta compradora de prueba**.

Sin `MP_ACCESS_TOKEN` los endpoints de pago responden 503 y el resto de la app funciona igual.

---

## 🗄️ Cambios en el esquema de base de datos

Todo cambio de tablas o columnas se hace con una **nueva migración** en
`api/src/main/resources/db/migration`, siguiendo el formato `V<n>__descripcion.sql`
(por ejemplo `V2__reserva_por_meses.sql`). Nunca edites una migración ya aplicada.

`V1__esquema_inicial.sql` es la línea base: en una base vacía se ejecuta completa; en una
base existente sin historial (Supabase) Flyway la registra como *baseline* sin ejecutarla.

---

## 👥 Roles y Credenciales
* **Administrador:** se crea al primer arranque con `APP_ADMIN_INITIAL_EMAIL` (por defecto `roger@gmail.com`) y `APP_ADMIN_INITIAL_PASSWORD`, definidos en `api/.env`.
* **Propietario / Inquilino:** se registran desde la aplicación. Los usuarios de prueba antiguos (`propietario@roomix.com`, `inquilino@roomix.com`) se eliminan al arrancar.
