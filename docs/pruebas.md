# Pruebas

## Automatizadas (backend)

Ejecutar: `cd api && .\mvnw.cmd test`. Usan **H2 en memoria** (modo PostgreSQL) y no necesitan base de datos ni
credenciales; el cliente de Mercado Pago se reemplaza por un mock.

Resultado actual: **29 pruebas aprobadas, 0 fallidas** (2 omitidas: requieren PostgreSQL local y se activan con
`ROOMIX_TEST_LOCAL_POSTGRES=true`).

| Clase | Pruebas | Qué cubre |
|---|---|---|
| `ApiApplicationTests` | 1 | El contexto de Spring arranca con toda la configuración |
| `RoomixIntegrationTest` | 13 | Registro y login por rol, rechazo de registro como admin, propiedades, cuartos, búsqueda pública, reserva por meses (total exacto, fecha de fin, rechazo de 0 y 13 meses), aprobación y reseñas |
| `PaymentFlowIntegrationTest` | 12 | Permisos de pago, monto = primer mes + depósito, conciliación idempotente, intento rechazado tardío, monto distinto, acceso de terceros, firma del webhook (válida e inválida), temas ignorados, tarifa de publicación, `/rooms/my-rooms` |
| `NotificationFlowIntegrationTest` | 3 | Flujo completo solicitud → aprobación → pago → reseña con los avisos correctos, rechazo y moderación, aislamiento de notificaciones por usuario |
| `LocalPostgresRegistrationTest` | 2 (omitidas) | Registro contra PostgreSQL real con rollback |

## Validaciones en navegador

Con Edge en modo headless (protocolo DevTools) sobre `http://localhost:4200`, en 1440 px y 390 px:

- **Reserva por meses:** un solo calendario, inicio mínimo = mañana, stepper y atajos 1/3/6/12, totales correctos,
  sin desbordes ni errores de consola, y una reserva real guardada con `months=3`.
- **Pagos:** botón *Pagar* en reservas aprobadas, *Pagar publicación* en Mis inmuebles, comprobante en estados
  acreditado/pendiente/rechazado y vuelta cancelada de Mercado Pago.
- **Notificaciones:** contador, panel, navegación a la sección, marcar todas como leídas, Escape y vista móvil.

## Integración real con Mercado Pago (sandbox)

A través del túnel público (ngrok → `ng serve` → backend):

- Preferencia creada en Mercado Pago con 750 PEN, `external_reference`, `back_urls`, `auto_return=approved` y
  `notification_url` correctos.
- Webhook alcanzable desde internet: firma inválida → 401; sin firma → consulta a Mercado Pago.
- **Pago de punta a punta aprobado** con una cuenta compradora de prueba (verificado por el equipo).

## Frontend

- `npm run build`: compilación de producción sin errores.
- `npm run check:components`: todos los archivos de componentes por debajo de 300 líneas.
