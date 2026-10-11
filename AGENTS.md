# Roomix Abancay - AGENTS Instructions & Rules

Este repositorio cuenta con un sistema de diseño de alta fidelidad basado en los principios de **Emil Kowalski**, la filosofía de artesanía **Impeccable** y el **Taste Skill** de interfaces modernas.

## 1. Principios de Diseño Obligatorios (Emil Kowalski + Impeccable)
- **Física de Animación y Easings:**
  - Evitar animaciones lineales (`linear`) o genéricas sin propósito.
  - Usar curvas de aceleración y desaceleración naturales:
    - Rápido / táctil: `cubic-bezier(0.16, 1, 0.3, 1)` (150ms - 200ms)
    - Despliegue de paneles/modales: `cubic-bezier(0.32, 0.72, 0, 1)` (240ms - 320ms)
    - Resortes y rebote sutil: `cubic-bezier(0.34, 1.56, 0.64, 1)`
  - Micro-interacciones activas: Todos los botones interactivos deben tener respuesta táctil al presionar (`:active { transform: scale(0.97); }`).
- **Sistema de Espaciado (Ritmo 4px / 8px):**
  - La escala de espaciado se ciñe a múltiplos de 4 y 8: `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px`.
  - El padding interno de un contenedor siempre debe ser menor o armónico con el margen exterior (`inner padding < outer padding`).
- **Jerarquía Tipográfica y Alto Contraste:**
  - Títulos: `Outfit` (700-800) con `line-height: 1.15 - 1.25` y letter-spacing ajustado.
  - Cuerpo e interfaz: `Plus Jakarta Sans` (400, 500, 600).
  - Precios, números y métricas: siempre con alineación numérica tabular (`font-feature-settings: 'tnum'`).
- **Bordes, Sombras y Elevación:**
  - No usar sombras oscuras o pesadas de un solo nivel. Usar sombras multicapa sutiles (luz ambiental + luz directa).
  - Bordes nítidos con opacidad adaptativa (`rgba(0, 0, 0, 0.07)` o `rgba(0, 82, 255, 0.12)`).
  - Resalte superior sutil en tarjetas (highlight inset de 1px).

## 2. Taste Skill (Criterio Visual y Anti-Patrones)
- Consultar y aplicar la habilidad `taste-skill` (`.agents/skills/taste-skill/SKILL.md`) antes de crear componentes o rediseñar vistas.
- Eliminar aspectos genéricos de plantillas de IA: paletas discordantes, botones gigantes desproporcionados, texto plano sin contraste ni microdetalles.
- Toda información de estado (insignias, filtros, servicios) debe tener peso visual balanceado y alineación óptica.

## 3. Automatización de Pruebas Visuales y MCP
- **Figma MCP:** Configurado en `.agents/mcp_config.json` para inspección de diseño y tokens de Figma.
- **Pruebas en Navegador (Playwright / Browser Subagent):**
  - Antes de dar por finalizado un cambio visual relevante, ejecutar validación en navegador (`http://localhost:4200`) para auditar renderizado, clicabilidad y ausencia de overflow.
