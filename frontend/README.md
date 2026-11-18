# Frontend de RoomiGo (Angular 21)

SPA con componentes standalone y señales. Ver la [arquitectura](../docs/arquitectura.md) para el detalle.

## Comandos

| Comando | Uso |
|---|---|
| `npm install` | Instala dependencias |
| `npm start` | Servidor de desarrollo en `http://localhost:4200` (con `proxy.conf.mjs`: `/api` → `localhost:8081`) |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run check:components` | Verifica que ningún archivo de componente supere 300 líneas |

## Estructura

```text
src/app/
├── app.ts / app.html          # Componente raíz: estado global con señales
├── core/                      # Servicios (API, Auth, Mercado Pago, Notificaciones) y modelos
├── components/layout/         # Navbar, campana de notificaciones, menú móvil, footer
├── components/ui/modals/      # Reserva, publicación, detalle, comprobante, perfil, ajustes...
├── components/views/          # Inicio, catálogo, paneles de inquilino, propietario y administrador
└── shared/                    # Componentes reutilizables (toast)
```

La URL del backend se resuelve en `core/api-config.ts`: `http://localhost:8081/api/v1` en local y `/api/v1` en
cualquier otro dominio (Vercel reenvía `/api/*` al backend en Render).

Las reglas de diseño (espaciado, tipografía, animaciones) están en [`AGENTS.md`](../AGENTS.md).
