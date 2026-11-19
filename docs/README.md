# Documentación de RoomiGo (Roomix Abancay)

| Documento | Contenido |
|---|---|
| [Arquitectura](arquitectura.md) | Stack con versiones, capas del backend, frontend, seguridad y despliegue |
| [Modelo de datos](modelo-datos.md) | Diagrama ER, migraciones Flyway, tablas, columnas y enums |
| [API REST](api.md) | Los 41 endpoints con método, ruta, rol requerido y descripción |
| [Flujos de negocio](flujos.md) | Reserva por meses, pago con Mercado Pago, moderación y notificaciones |
| [Pruebas](pruebas.md) | Pruebas automatizadas, validaciones en navegador e integración con Mercado Pago |
| [Hoja de ruta](hoja-de-ruta.md) | Qué está hecho y qué sigue: Fase 5 (casas y venta), fotos obligatorias, seguridad y despliegue |
| [Instalación](../README.md) | Cómo levantar el proyecto en local |
| [Auditoría](../AUDIT-REPORT.md) | Hallazgos de seguridad y calidad, con su estado actual |
| [Entregables (Word / PDF)](entregables/) | **Informe de documentación técnica** (con anexos: informe del proyecto e instalación) y **Manual de usuario** |

Material para el informe y el manual de usuario: [`informe/`](informe/) (capturas por rol y diagramas).

> Las tablas de `api.md` y `modelo-datos.md` se generaron a partir del código y de la base migrada; si cambia el
> esquema o un controlador, conviene regenerarlas.
