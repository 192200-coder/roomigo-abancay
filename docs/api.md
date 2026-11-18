# API REST de RoomiGo

> Generado a partir de los controladores (`api/src/main/java/com/roomix/api/controller`) y de
> `SecurityConfig`. Documentación interactiva: **`/swagger-ui.html`** (OpenAPI en `/api-docs`).

- **Base:** `/api/v1` · formato JSON · fechas ISO-8601.
- **Autenticación:** `Authorization: Bearer <JWT>` (se obtiene en `POST /api/v1/auth/login`). El token dura 24 h.
- **Roles:** `TENANT` (inquilino), `OWNER` (propietario), `ADMIN` (administrador).
- **Respuesta estándar:** `{ "success": true, "message": "...", "data": ..., "timestamp": "..." }`.
  Los errores devuelven `{ "success": false, "message": "...", "errors": [...] }` con 400, 401, 403, 404, 409, 502 o 503.

Total: **41 endpoints**.

## Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Público | Inicio de sesión |
| `POST` | `/api/v1/auth/register` | Público | Registro de usuario |
| `POST` | `/api/v1/auth/social/send-code` | Público | Enviar código de verificación para Google/Facebook |
| `POST` | `/api/v1/auth/social/verify` | Público | Verificar código e iniciar sesión con Google/Facebook |

## Habitaciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/rooms` | Público | Listar habitaciones disponibles con filtros y paginación |
| `POST` | `/api/v1/rooms` | OWNER / ADMIN | Crear habitación |
| `DELETE` | `/api/v1/rooms/{id}` | OWNER / ADMIN | Eliminar habitación |
| `GET` | `/api/v1/rooms/{id}` | Público | Detalle de habitación por ID |
| `PUT` | `/api/v1/rooms/{id}` | OWNER / ADMIN | Actualizar habitación |
| `PATCH` | `/api/v1/rooms/{id}/status` | OWNER / ADMIN | Cambiar estado de la habitación |
| `GET` | `/api/v1/rooms/my-rooms` | OWNER / ADMIN | Habitaciones del propietario autenticado |
| `GET` | `/api/v1/rooms/search` | Público | Búsqueda filtrada y paginada de habitaciones disponibles |

## Propiedades

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/properties` | OWNER / ADMIN | Crear propiedad |
| `DELETE` | `/api/v1/properties/{id}` | OWNER / ADMIN | Eliminar propiedad |
| `GET` | `/api/v1/properties/{id}` | Público | Obtener propiedad por ID |
| `GET` | `/api/v1/properties/my-properties` | OWNER / ADMIN | Listar mis propiedades |

## Reservas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | TENANT / ADMIN | Solicitar reserva |
| `GET` | `/api/v1/bookings/{id}` | Autenticado | Obtener detalle de reserva |
| `PATCH` | `/api/v1/bookings/{id}/status` | OWNER / ADMIN | Aprobar o rechazar reserva |
| `GET` | `/api/v1/bookings/my-bookings` | TENANT / ADMIN | Listar mis reservas (Inquilino) |
| `GET` | `/api/v1/bookings/owner-requests` | OWNER / ADMIN | Listar solicitudes recibidas (Propietario) |

## Pagos (Mercado Pago)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/payments/checkout/bookings/{reservationId}` | Autenticado | Iniciar el pago de una reserva aprobada (primer mes + depósito) |
| `POST` | `/api/v1/payments/checkout/rooms/{roomId}/publication` | Autenticado | Iniciar el pago de la tarifa de publicación de un cuarto |
| `GET` | `/api/v1/payments/mercadopago/confirm` | Autenticado | Confirmar un pago al volver de Checkout Pro |
| `POST` | `/api/v1/payments/mercadopago/webhook` | Público | Webhook de notificaciones de Mercado Pago |

## Reseñas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/reviews` | TENANT / ADMIN | Crear reseña |
| `GET` | `/api/v1/reviews/room/{roomId}` | Público | Obtener reseñas de una habitación |

## Notificaciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Autenticado | Listar mis notificaciones (más recientes primero) |
| `PATCH` | `/api/v1/notifications/{id}/read` | Autenticado | Marcar una notificación como leída |
| `PATCH` | `/api/v1/notifications/read-all` | Autenticado | Marcar todas mis notificaciones como leídas |
| `GET` | `/api/v1/notifications/unread-count` | Autenticado | Cantidad de notificaciones sin leer |

## Administración

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/admin/rooms` | ADMIN | Obtener todas las habitaciones (para gestión de administrador) |
| `DELETE` | `/api/v1/admin/rooms/{id}` | ADMIN | Eliminar anuncio de habitación permanentemente (Administrador) |
| `PUT` | `/api/v1/admin/rooms/{id}` | ADMIN | Actualizar anuncio de habitación (Administrador) |
| `PATCH` | `/api/v1/admin/rooms/{id}/approve` | ADMIN | Aprobar anuncio de habitación y habilitarlo al público |
| `PATCH` | `/api/v1/admin/rooms/{id}/location` | ADMIN | Actualizar manualmente la ubicación de una habitación (Administrador) |
| `PATCH` | `/api/v1/admin/rooms/{id}/reject` | ADMIN | Rechazar anuncio de habitación |
| `GET` | `/api/v1/admin/rooms/pending` | ADMIN | Obtener anuncios de habitaciones pendientes de aprobación |
| `GET` | `/api/v1/admin/stats` | ADMIN | Métricas y estadísticas de la plataforma Roomix Abancay |

## Sistema

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/` | Público | Root API Endpoint |
| `GET` | `/health` | Público | Health Check Endpoint |

## Notas de seguridad

- El webhook de Mercado Pago es público, pero valida la firma `x-signature` (HMAC-SHA256 con `MP_WEBHOOK_SECRET`)
  y **nunca confía en el cuerpo recibido**: siempre consulta el pago a la API de Mercado Pago.
- Los endpoints de pago verifican que el usuario sea el dueño de la reserva o del cuarto (403 en caso contrario).
- Cada usuario solo puede leer y marcar sus propias notificaciones (404 si la notificación es de otro).
- `RateLimitingFilter` limita peticiones por IP y `LoginAttemptService` bloquea intentos de fuerza bruta en el login.
