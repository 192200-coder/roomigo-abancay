# Hoja de ruta

Estado al 20 de noviembre de 2026. Qué está hecho, qué sigue y en qué orden.

## ✅ Completado

| Fase | Resultado |
|---|---|
| 1. Cimientos | Flyway (V1–V4; hoy V1–V7), PostgreSQL en Docker, `api/.env`, Swagger corregido |
| 2. Reserva por meses | Fecha de inicio + N meses (1–12); total = renta × meses + depósito |
| 3. Mercado Pago | Checkout Pro real: pago inicial (1.er mes + depósito) y tarifa de publicación; webhook firmado; verificado en sandbox |
| 4. Notificaciones | Avisos por eventos y campana en el navbar; se corrigió el aviso de error repetido (`/rooms/my-rooms` no existía) |
| Documentación | `docs/` técnico + entregables en Word/PDF (informe y manual de usuario) |
| Publicación | Repo propio, scripts `iniciar.ps1` / `detener.ps1` y datos demo (`scripts/datos-demo.mjs`) |
| 5. Casas, venta y segmentación | Tipos por público (Cuarto · Minidepartamento · Departamento · Casa entera), alquiler o venta, pedidos de visita en lugar de reserva, filtros e insignias (V5–V7) |
| Fotos obligatorias | Fachada + habitación + baño validadas en backend y frontend (máx. 8, comprimidas en el navegador), galería en la ficha |

## ⏭️ Siguiente: Fase 6 — Seguridad

1. Recuperación de contraseña en el backend (hoy guarda datos en `localStorage`).
2. CORS con lista explícita por entorno (sin comodines `*.vercel.app` ni `localhost:*` en producción).
3. CSP más estricta (sin `unsafe-inline`).
4. Opcional: token en cookie `HttpOnly`, `X-Forwarded-For` solo detrás de un proxy de confianza.

## 🚀 Despliegue desde este repositorio

Vercel y Render siguen conectados a los repositorios anteriores. Para desplegar desde aquí:

1. **Respaldar Supabase** antes del primer despliegue: Flyway registrará la línea base y aplicará V2–V7.
2. **Render:** nuevo servicio Docker apuntando a este repo, *Root Directory* `api`, health check `/health`
   y las variables de `api/.env.example` (con un `APP_JWT_SECRET` nuevo).
3. **Vercel:** importar este repo con *Root Directory* `frontend`; revisar en `frontend/vercel.json` que la URL de
   Render sea la correcta.
4. **Mercado Pago:** crear una aplicación propia de RoomiGo (separada de la de práctica) y configurar su webhook de
   producción.

## 🧹 Deuda técnica menor

- Las fotos se guardan en base64 dentro de la base (`room_images.image_url`): conviene moverlas a un
  almacenamiento de archivos (Supabase Storage o similar) antes de producción.
- Al editar una publicación todavía no se pueden cambiar sus fotos desde el formulario (el backend ya lo admite).
- La operación (alquiler/venta) no se cambia al editar: hay que crear otra publicación.
- El botón «Continuar con Google» aparece, pero el backend tiene el acceso social desactivado: activarlo
  (configurar OAuth y SMTP) u ocultar el botón.
- `mock-data.ts` y algunos *fallbacks* del frontend todavía ocultan errores del backend.
- `app.ts` concentra demasiada lógica (≈2 600 líneas): dividir por funcionalidad.
- Vulnerabilidades de `npm audit` que requieren evaluar la actualización mayor de Angular CLI.
- El correo del administrador por defecto (`APP_ADMIN_INITIAL_EMAIL`) es personal; conviene uno genérico.
