# 🏠 Roomix - Plataforma de Alquiler de Cuartos y Departamentos (Abancay, Apurímac)

Plataforma web integral para la búsqueda, publicación y gestión de habitaciones y alojamientos en la ciudad de **Abancay, Apurímac - Perú**.

---

## 🚀 Tecnologías

### Backend (API REST)
* **Framework:** Java 17 + Spring Boot 3.3.4
* **Seguridad:** Spring Security 6 + JSON Web Tokens (JWT)
* **Persistencia:** Spring Data JPA + Hibernate + PostgreSQL
* **Documentación:** OpenAPI 3 / Swagger UI (`/swagger-ui.html`)
* **Validación:** Jakarta Bean Validation

### Frontend (SPA)
* **Framework:** Angular 21 (Componentes Standalone & Signals)
* **Estilos:** CSS3 Moderno con variables CSS, glassmorphism y diseño responsivo
* **Iconos:** FontAwesome 6

---

## 📁 Estructura del Proyecto

```text
├── api/                  # Backend Spring Boot (REST API en puerto 8081)
│   ├── src/main/java/    # Código fuente: controllers, services, entities, security, etc.
│   ├── src/main/resources/# application.properties, base de datos
│   └── pom.xml           # Configuración Maven
├── frontend/             # Frontend Angular (Dev Server en puerto 4200)
│   ├── src/app/          # Componentes, vistas y servicios Angular
│   ├── package.json      # Dependencias Node.js
│   └── angular.json      # Configuración Angular CLI
└── .gitignore            # Exclusión de dependencias (node_modules, target, etc.)
```

---

## 🛠️ Cómo Ejecutar el Proyecto

### 1. Base de Datos (PostgreSQL)
Asegúrate de contar con PostgreSQL corriendo en el puerto `5432` con una base de datos llamada `roomix_db`.

### 2. Backend (Spring Boot)
```bash
cd api
./mvnw spring-boot:run
```
* API disponible en: `http://localhost:8081/api/v1`
* Documentación Swagger: `http://localhost:8081/swagger-ui.html`

### 3. Frontend (Angular)
```bash
cd frontend
npm install
npm start
```
* Aplicación web disponible en: `http://localhost:4200`

---

## 👥 Roles y Credenciales Semilla
* **Administrador:** `admin@roomix.com` / `admin123`
* **Propietario:** `propietario@roomix.com` / `password123`
* **Inquilino:** `inquilino@roomix.com` / `password123`
