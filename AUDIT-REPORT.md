# Estado de los hallazgos (actualizado al 18 de noviembre de 2026)

La auditoría original (más abajo) se conserva como registro histórico. Esta tabla indica qué se resolvió en las
fases 1–4 y qué sigue pendiente.

| Hallazgo | Estado | Cómo se resolvió / qué falta |
|---|---|---|
| Pagos simulados marcados como aprobados (crítico 2) | ✅ Resuelto | Integración real con Mercado Pago Checkout Pro; el estado sale siempre de la API de Mercado Pago (`PaymentReconciler`). Se eliminó la simulación y los formularios de tarjeta del frontend. |
| Webhook sin autenticación criptográfica (crítico 3) | ✅ Resuelto | Firma `x-signature` HMAC-SHA256, consulta del pago al proveedor, validación de monto/moneda e idempotencia con bloqueo pesimista. |
| Esquema gestionado por Hibernate (`ddl-auto`) | ✅ Resuelto | Flyway V1–V4; Hibernate solo valida. |
| Pruebas no reproducibles / fallando | ✅ Resuelto | 29 pruebas en verde con H2 y Mercado Pago simulado. |
| Swagger devolvía 500 (springdoc 2.x con Boot 4) | ✅ Resuelto | springdoc 3.0.3. |
| `GET /rooms/my-rooms` inexistente (aviso repetido "No se pudieron cargar tus habitaciones") | ✅ Resuelto | Endpoint implementado con prueba de regresión. |
| Notificaciones sin implementar | ✅ Resuelto | Eventos de dominio, API `/notifications` y campana con sondeo silencioso. |
| Tarifa de publicación inconsistente (S/ 3 en la interfaz, S/ 15 en el backend) | ✅ Resuelto | Valor único en el frontend; la recaudación solo suma tarifas pagadas. |
| Mensajes de validación con tildes corruptas ("telÃ©fono") | ✅ Resuelto | Codificación corregida en `RegisterRequestDto`. |
| RLS ejecutado contra H2 con advertencias | 🟡 Mitigado | Desactivado por defecto (`APP_SUPABASE_RLS_ENABLED=false`); conviene moverlo a una migración propia de Supabase. |
| Recuperación de contraseña en `localStorage` (crítico 1) | ⏳ Pendiente | Fase 6: endpoint de recuperación en el backend con código temporal de un solo uso. |
| CSP permisiva (crítico 4) | ⏳ Pendiente | Fase 6: quitar `unsafe-inline` y declarar dominios concretos. |
| CORS con comodines y credenciales (crítico 5) | ⏳ Pendiente | Fase 6: lista explícita por entorno. |
| JWT en `localStorage`, `X-Forwarded-For` sin proxy de confianza, `open-in-view` activo | ⏳ Pendiente | Mejoras de endurecimiento posteriores. |
| `mock-data.ts` y *fallbacks* que ocultan errores | ⏳ Pendiente | Sigue importado por `RoomixApiService`. |
| `app.ts` como componente monolítico | ⏳ Pendiente | Se redujo de 2.947 a 2.627 líneas al quitar código muerto; falta dividirlo por funcionalidad. |
| Vulnerabilidades de `npm audit` | ⏳ Pendiente | Requieren evaluar la actualización mayor de Angular CLI. |

---

# Resumen General

Auditoría estática, de configuración, dependencias, pruebas y ejecución realizada sobre el repositorio Roomix Abancay.

- Alcance inventariado: 344 archivos de proyecto, excluyendo `node_modules`, `.m2`, `target`, `dist` y cachés generadas.
- Backend: 97 clases Java, Spring Boot 4.0.6, Spring Security, Spring Data JPA/Hibernate, PostgreSQL/Supabase, MySQL y H2 para pruebas.
- Frontend: Angular 21, TypeScript, RxJS, almacenamiento local y simulaciones de pago.
- Verificación backend: `mvn clean test` con Java 25.0.2: 10 pruebas ejecutadas, 10 aprobadas.
- Verificación frontend: `npm run build` y `npm run check:components`: correctos; 125 componentes bajo el límite configurado.
- Riesgo global: ALTO hasta corregir pagos simulados, recuperación de contraseña en `localStorage`, webhook sin firma y CORS/CSP demasiado amplios.

La revisión cubrió código fuente, configuraciones, scripts, recursos SQL, entidades, repositorios, servicios, controladores, DTO, autenticación, frontend, dependencias y pruebas. Los binarios y artefactos generados se trataron como salidas, no como código fuente auditable.

# Arquitectura Detectada

## Backend

Arquitectura monolítica por capas:

`Controller -> Service -> Repository -> JPA/Hibernate -> PostgreSQL/Supabase`

Componentes principales:

- `config`: seguridad, CORS, OpenAPI, inicialización y configuración de Spring.
- `controller`: autenticación, cuartos, propiedades, reservas, reseñas, pagos, administración y salud.
- `service/impl`: reglas de negocio para usuarios, propiedades, cuartos, reservas y reseñas.
- `entity`: usuarios, roles, propiedades, cuartos, imágenes, amenidades, reservas, pagos, favoritos, notificaciones y códigos de verificación.
- `repository`: Spring Data JPA y una especificación dinámica para búsqueda de cuartos.
- `security`: JWT, filtro, rate limiting, protección anti-fuerza-bruta y saneamiento de entrada.

## Frontend

Aplicación Angular con componentes de presentación, servicios de API/autenticación/favoritos/pagos y datos mock persistidos en navegador. La composición visual actual concentra demasiado comportamiento en `app.ts` y `app.css`, aunque los componentes individuales pasan el chequeo de tamaño.

## Persistencia y datos

- Producción configurada para PostgreSQL mediante variables de entorno.
- Perfil MySQL disponible en `application-mysql.properties`.
- H2 en memoria para pruebas de integración.
- Hibernate gestiona el esquema; producción usa `ddl-auto=validate`, lo que evita mutaciones automáticas pero requiere migraciones controladas.
- Existe SQL de endurecimiento RLS para Supabase y también ejecución de SQL PostgreSQL desde `DataInitializer`.

## Flujo de negocio observado

1. Registro/login genera JWT.
2. Propietario crea propiedad y publica cuarto.
3. Administrador revisa/aprueba o rechaza.
4. Inquilino busca cuartos disponibles y crea reserva.
5. Propietario actualiza estado de reserva.
6. Pago y reseña se registran asociados a reserva/cuarto.

# Funcionalidades Identificadas

- Autenticación local y social con códigos de verificación.
- Roles `ADMIN`, `OWNER` y `TENANT`.
- Registro con validación de email, contraseña, teléfono y rol.
- Gestión de propiedades y cuartos.
- Búsqueda paginada por ciudad, precio y filtros del cuarto.
- Aprobación administrativa de publicaciones.
- Reservas por rango de fechas y consultas por usuario/propietario.
- Reseñas por habitación.
- Favoritos y notificaciones.
- Métodos de pago Yape, Plin, tarjetas y flujo Mercado Pago simulado.
- API de salud y documentación OpenAPI.
- Frontend con vistas públicas, autenticación, administración y paneles de usuario.

Endpoints principales detectados:

- `/api/v1/auth/register`, `/login`, `/social/send-code`, `/social/verify`.
- `/api/v1/rooms`, `/rooms/search`, `/rooms/{id}`.
- `/api/v1/properties`, `/properties/my-properties`.
- `/api/v1/bookings`, `/bookings/my-bookings`, `/bookings/owner-requests`.
- `/api/v1/reviews`, `/reviews/room/{roomId}`.
- `/api/v1/payments/methods`, `/payments/mercadopago/*`.
- `/api/v1/admin/*` y `/health`.

# Errores Encontrados

## Corregidos

1. Las propiedades críticas de base de datos y JWT tenían valores sensibles embebidos. Se migraron a variables de entorno y `show-sql` quedó desactivado por defecto.
2. El endpoint de pagos estaba completamente permitido. Ahora solo métodos públicos y webhook son anónimos; las operaciones de pago requieren autenticación.
3. El DTO de registro no imponía la política completa de contraseña ni validaba teléfono peruano. Se añadieron patrones de mayúscula, número, carácter especial y móvil peruano de nueve dígitos.
4. Las pruebas dependían de una base externa y no podían ejecutarse de forma reproducible. Se añadió H2 aislado para pruebas y se corrigió el secreto JWT de prueba.
5. `DataInitializer` creaba el administrador con una contraseña fija. Ahora requiere `APP_ADMIN_INITIAL_PASSWORD` solo cuando debe crear la cuenta inicial.
6. `DataInitializer` ejecutaba borrados de datos mock en cada arranque. Ahora requiere explícitamente `ROOMIX_PURGE_MOCK_DATA=true`.

## Pendientes o defectos funcionales

- La conexión real a Supabase no se pudo validar: el host configurado actualmente responde `ENOTFOUND` para el usuario/tenant de PostgreSQL. No es un fallo de compilación; requiere un endpoint, usuario, contraseña y puerto válidos.
- La inicialización RLS se ejecuta contra H2 y genera advertencias de SQL PostgreSQL. Debe condicionarse al motor PostgreSQL o trasladarse a una migración SQL de despliegue.
- El `RoomixIntegrationTest` valida varios flujos en un orden implícito y comparte datos de contexto. Debe dividirse en fixtures aislados para evitar dependencia entre pruebas.
- Hay advertencias de Java 25 por auto-attach de Mockito/Byte Buddy. Conviene configurar el agente en Surefire antes de futuras versiones del JDK.
- Spring informa `open-in-view` habilitado; debe desactivarse y resolver las cargas necesarias explícitamente.

# Vulnerabilidades Detectadas

## Críticas / altas

### 1. Recuperación de contraseña en el navegador

- Archivo: `frontend/src/app/core/auth.service.ts`, aproximadamente líneas 82-123.
- Hallazgo: código de recuperación y nueva contraseña se guardan en `localStorage`.
- Riesgo: cualquier XSS, extensión o usuario con acceso al perfil del navegador puede leer credenciales y modificar el flujo.
- Corrección recomendada: endpoint backend de recuperación con código hash temporal, expiración, uso único, rate limit y cambio de contraseña exclusivamente en servidor. El frontend debe conservar solo el estado temporal no sensible.

### 2. Pagos simulados como aprobados

- Archivos: `api/src/main/java/com/roomix/api/controller/PaymentController.java` y `frontend/src/app/core/mercado-pago.service.ts`.
- Hallazgo: el backend marca pagos como aprobados sin confirmar con Mercado Pago; el frontend devuelve pago aprobado simulado ante error.
- Riesgo: fraude, reservas confirmadas sin dinero recibido y daño financiero.
- Corrección recomendada: integrar SDK/API oficial en backend, verificar firma y estado en servidor, usar idempotencia por operación y nunca devolver `approved` desde un `catchError`. En error, devolver `PENDING` o `FAILED`.

### 3. Webhook sin autenticación criptográfica

- Archivo: `PaymentController.java`, método `handleWebhook`, aproximadamente línea 177.
- Hallazgo: acepta un mapa JSON anónimo y responde recibido sin validar firma, origen, evento, importe ni idempotencia.
- Riesgo: un tercero puede fabricar confirmaciones de pago.
- Corrección recomendada: validar firma oficial, consultar la transacción al proveedor, comparar monto/reserva y guardar eventos procesados.

### 4. CSP demasiado permisiva

- Archivo: `api/src/main/java/com/roomix/api/config/SecurityConfig.java`, aproximadamente línea 39.
- Hallazgo: `unsafe-inline`, `https:` global en scripts/estilos/conexiones y `connect-src` abierto.
- Riesgo: reduce la eficacia contra XSS y conexiones no previstas.
- Corrección recomendada: eliminar `unsafe-inline`, usar nonces/hashes, declarar dominios concretos de API, imágenes, mapas y pagos.

### 5. CORS amplio con credenciales

- Archivo: `api/src/main/java/com/roomix/api/config/CorsConfig.java`, aproximadamente líneas 22-26.
- Hallazgo: patrones wildcard para Vercel y puertos localhost junto con `allowCredentials(true)`.
- Riesgo: cualquier despliegue preview permitido puede operar con credenciales del usuario.
- Corrección recomendada: lista explícita por entorno y propiedad configurable; no aceptar wildcard en producción.

## Medias

- JWT se almacena en `localStorage`; un XSS puede exfiltrarlo. Preferir cookie `HttpOnly`, `Secure`, `SameSite` y protección CSRF apropiada.
- Logs de autenticación incluyen el email/IP lógico de la clave. Deben enmascararse y enviarse a un sistema de auditoría con retención controlada.
- `getClientIp` confía en `X-Forwarded-For`; debe confiar en esos headers solo detrás de un proxy conocido.
- RLS se intenta habilitar desde la aplicación y se ignoran errores. La seguridad de base no debe depender de una operación que puede fallar silenciosamente.
- Dependencias frontend presentaron vulnerabilidades reportadas por `npm audit`; `npm audit fix` aplicado dejó vulnerabilidades pendientes, entre ellas cadena Angular/Vite/Undici/Piscina. `--force` implicaría Angular CLI 22 y cambio mayor, por lo que no se aplicó automáticamente.

## OWASP no evidenciado en la revisión

- SQL Injection directo no se observó en búsqueda: usa Criteria/JPA parametrizado.
- Inyección de comandos y SSRF directo no se observaron en el código auditado.
- XSS directo con `innerHTML` no se observó; sí existe `bypassSecurityTrustResourceUrl` para mapas y debe validarse contra allowlist.
- CSRF está deshabilitado bajo modelo JWT; al migrar a cookies HttpOnly deberá reactivarse protección CSRF.

# Código Innecesario

- `mock-data.ts` y múltiples `catchError` del cliente mantienen datos falsos como si fueran respuestas de producción. Deben limitarse a perfil demo/desarrollo.
- Fallbacks de `RoomixApiService` ocultan errores del backend y pueden mostrar disponibilidad, reservas o favoritos inexistentes.
- `app.ts` concentra lógica de autenticación, administración, exportación, mapas, configuración y presentación; es un componente tipo “God component”.
- `app.css` es un monolito de estilos de más de cinco mil líneas; debe separarse por feature/tokens.
- La carpeta `frontend/public/figma` contiene activos y posibles duplicados que deben inventariarse antes de eliminarse.
- Imports y métodos no usados requieren una pasada automática con ESLint/TypeScript strict; no se eliminó código solo por coincidencia textual para evitar romper plantillas dinámicas.

# Problemas de Rendimiento

- `RoomServiceImpl.getAllRoomsForAdmin()` usa `findAll()` y mapea todo en memoria; debe paginarse.
- Reservas, propiedades, reseñas y favoritos exponen métodos `List` además de `Page`, lo que puede cargar colecciones grandes.
- Relaciones de imágenes/amenidades pueden producir N+1 o cargas perezosas durante el mapeo; usar `@EntityGraph` o consultas DTO específicas.
- `LoginAttemptService` y `RateLimitingFilter` mantienen mapas en memoria por clave/IP. Tienen limpieza parcial; en múltiples instancias no comparten estado y bajo cardinalidad alta pueden crecer. Usar Redis/Caffeine con expiración.
- `spring.jpa.open-in-view` está habilitado y puede generar consultas durante serialización/renderizado.
- El bundle inicial frontend es aproximadamente 991 kB; conviene lazy-loading por rutas y dividir funcionalidades administrativas/pagos.
- La búsqueda usa paginación, lo cual es correcto, pero debe tener índices en ciudad, estado, precio, propiedad y fechas de reserva.

# Refactorizaciones Recomendadas

1. Separar `PaymentService` del controller y reemplazar mapas genéricos por DTOs tipados.
2. Implementar migraciones Flyway/Liquibase para esquema, índices, RLS y datos iniciales.
3. Mover configuración de seguridad por perfiles `local`, `test`, `staging` y `prod`.
4. Reemplazar JWT en `localStorage` por cookies HttpOnly o, como mínimo, reducir TTL y aplicar CSP estricta.
5. Crear `PasswordResetService` servidor-side con códigos hash y expiración.
6. Crear un adaptador `PaymentGateway` con implementación real y fake solo bajo perfil de pruebas.
7. Paginar todos los listados administrativos y de usuario.
8. Añadir pruebas negativas de autorización: acceso cruzado entre propietarios/inquilinos, pagos sin sesión, webhook falsificado y payloads inválidos.
9. Separar el componente raíz y los estilos por feature, manteniendo tokens de diseño compartidos.
10. Añadir observabilidad estructurada, correlation ID, métricas de latencia/error y alertas de pagos fallidos.

# Cambios Aplicados

- Variables sensibles de PostgreSQL/JWT externalizadas en `application.properties` y `application-mysql.properties`.
- `spring.jpa.show-sql` desactivado por defecto y `ddl-auto` configurable con default seguro `validate`.
- Endpoints de pago protegidos salvo métodos públicos y webhook.
- Validación backend de contraseña y teléfono peruano.
- Cuenta inicial configurable mediante `APP_ADMIN_INITIAL_PASSWORD`.
- Purga automática de datos mock protegida por `ROOMIX_PURGE_MOCK_DATA=false`.
- Suite backend aislada con H2 y secreto de prueba no productivo.
- Dependencias frontend actualizadas mediante `npm audit fix` sin forzar cambio mayor de Angular.
- Se corrigieron compatibilidades de Jackson 3 para Spring Boot 4 en el punto de entrada JWT.

# Archivos Modificados

Cambios de esta auditoría:

- `api/src/main/resources/application.properties`
- `api/src/main/resources/application-mysql.properties`
- `api/src/main/java/com/roomix/api/config/SecurityConfig.java`
- `api/src/main/java/com/roomix/api/config/DataInitializer.java`
- `api/src/main/java/com/roomix/api/dto/request/RegisterRequestDto.java`
- `api/src/main/java/com/roomix/api/security/JwtEntryPoint.java`
- `api/src/test/java/com/roomix/api/RoomixIntegrationTest.java`
- `api/src/test/resources/application.properties`
- `frontend/package-lock.json`
- `AUDIT-REPORT.md`

El repositorio ya contenía cambios de diseño de frontend previos a esta auditoría; no se revirtieron porque forman parte del trabajo del usuario.

# Recomendaciones Finales

Prioridad inmediata:

1. No habilitar producción con el flujo de pagos simulado.
2. Rotar cualquier credencial que haya estado en `application.properties` y configurar `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET` y `APP_ADMIN_INITIAL_PASSWORD` fuera del repositorio.
3. Corregir recuperación de contraseña y eliminar contraseñas de `localStorage`.
4. Implementar firma/idempotencia de webhooks y consultar el proveedor de pagos.
5. Restringir CORS/CSP por entorno.
6. Configurar el endpoint real de Supabase y verificar conectividad antes de usar datos reales.
7. Añadir migraciones e índices antes de cargar un volumen de usuarios/cuarto significativo.
8. Repetir `npm audit` desde una máquina con acceso al registry y evaluar actualizaciones mayores de Angular de forma planificada.

Conclusión: la base funcional es coherente y el proyecto compila con Java 25, pero todavía no debe considerarse listo para producción por los riesgos de pagos, recuperación de contraseña, configuración de origen y dependencia de datos mock/fallbacks del frontend.
