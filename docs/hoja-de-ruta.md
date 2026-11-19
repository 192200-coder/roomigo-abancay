# Hoja de ruta

Estado al 19 de noviembre de 2026. Qué está hecho, qué sigue y en qué orden.

## ✅ Completado

| Fase | Resultado |
|---|---|
| 1. Cimientos | Flyway (V1–V4), PostgreSQL en Docker, `api/.env`, Swagger corregido |
| 2. Reserva por meses | Fecha de inicio + N meses (1–12); total = renta × meses + depósito |
| 3. Mercado Pago | Checkout Pro real: pago inicial (1.er mes + depósito) y tarifa de publicación; webhook firmado; verificado en sandbox |
| 4. Notificaciones | Avisos por eventos y campana en el navbar; se corrigió el aviso de error repetido (`/rooms/my-rooms` no existía) |
| Documentación | `docs/` técnico + entregables en Word/PDF (informe y manual de usuario) |
| Publicación | Repo propio, scripts `iniciar.ps1` / `detener.ps1` y datos demo (`scripts/datos-demo.mjs`) |

## ⏭️ Siguiente: Fase 5 — Casas enteras, venta y segmentación

Pedido del docente tras la revisión. Decisión tomada: **extender la tabla `rooms`** como "publicación"
(no renombrarla), con migraciones Flyway nuevas.

- **Tipos orientados al público:** Cuarto (estudiantes) · Minidepartamento (parejas) · Departamento
  (familias grandes) · **Casa entera**. Hoy existen SINGLE / DOUBLE / SUITE / SHARED; hay que migrar los valores
  y actualizar las restricciones `CHECK` de la base.
- **Operación:** Alquiler o **Venta** (inspirado en los anuncios en postes de Abancay; foco en vivienda, no terrenos).
  - Venta: precio de venta, dormitorios, baños, área construida y de terreno.
  - En venta no se reserva ni se paga por Mercado Pago: botón **«Contactar / agendar visita»** que notifica al
    propietario.
- Filtros e insignias nuevos en el catálogo (tipo, operación, público objetivo).

## 📷 Fotos obligatorias al publicar (pedido del equipo)

Mínimo **3 fotografías por publicación: la casa (fachada), la habitación y el baño**. Validar en el backend
(no solo en el formulario) y definir el mínimo por tipo de inmueble cuando exista la Fase 5. Encaja hacerlo junto
con la Fase 5.

## 🔐 Fase 6 — Seguridad (de `AUDIT-REPORT.md`)

1. Recuperación de contraseña en el backend (hoy guarda datos en `localStorage`).
2. CORS con lista explícita por entorno (sin comodines `*.vercel.app` ni `localhost:*` en producción).
3. CSP más estricta (sin `unsafe-inline`).
4. Opcional: token en cookie `HttpOnly`, `X-Forwarded-For` solo detrás de un proxy de confianza.

## 🚀 Despliegue desde este repositorio

Vercel y Render siguen conectados a los repositorios anteriores. Para desplegar desde aquí:

1. **Respaldar Supabase** antes del primer despliegue: Flyway registrará la línea base y aplicará V2–V4.
2. **Render:** nuevo servicio Docker apuntando a este repo, *Root Directory* `api`, health check `/health`
   y las variables de `api/.env.example` (con un `APP_JWT_SECRET` nuevo).
3. **Vercel:** importar este repo con *Root Directory* `frontend`; revisar en `frontend/vercel.json` que la URL de
   Render sea la correcta.
4. **Mercado Pago:** crear una aplicación propia de RoomiGo (separada de la de práctica) y configurar su webhook de
   producción.

## 🧹 Deuda técnica menor

- El botón «Continuar con Google» aparece, pero el backend tiene el acceso social desactivado: activarlo
  (configurar OAuth y SMTP) u ocultar el botón.
- `mock-data.ts` y algunos *fallbacks* del frontend todavía ocultan errores del backend.
- `app.ts` concentra demasiada lógica (≈2 600 líneas): dividir por funcionalidad.
- Vulnerabilidades de `npm audit` que requieren evaluar la actualización mayor de Angular CLI.
- El correo del administrador por defecto (`APP_ADMIN_INITIAL_EMAIL`) es personal; conviene uno genérico.
