---
name: taste-skill
description: >-
  Use this skill whenever designing, evaluating, refactoring, or building user interfaces to guarantee high visual craft, modern aesthetics, elimination of AI-archetype patterns, and adherence to world-class interface standards (Linear, Stripe, Apple, Airbnb).
---

# Taste Skill: Criterio Visual y Calidad para Interfaces

Este skill define el estándar estético y el criterio de buen gusto (*Design Taste*) para elevar cualquier pantalla más allá del promedio o del aspecto típico generado por IA.

---

## 1. La Prueba "Anti-AI Slop" (Qué Evitar)

Las interfaces generadas por modelos no supervisados suelen cometer los siguientes errores:
1. **Paletas genéricas:** Azules primarios planos (`#0000ff`), verdes saturados sin matiz o grises deslavados.
2. **Botones e inputs desproporcionados:** Elementos gigantes que rompen la armonía visual y desbordan contenedores.
3. **Falta de ritmo espacial:** Textos pegados a los bordes, o espacios aleatorios sin escala métrica.
4. **Tarjetas planas sin profundidad:** Cajas blancas sobre fondos grises con bordes gruesos y oscuros.
5. **Iconografía discordante:** Iconos de diferentes grosores, estilos (relleno vs línea) o mal alineados ópticamente.

---

## 2. Los Pilares de una Interfaz con "Taste"

### A. Paleta de Color Curada y Armoniosa
- **Fondo:** Blanco perla suave (`#ffffff`) sobre capas secundarias limpias (`#f8fafc` o `#f1f5f9`).
- **Color de Acento:** Tinte intencional con luminosidad controlada (ej. Azul Eléctrico `#0052ff` con soporte en `#2563eb`).
- **Tonalidades de Texto:**
  - Alto contraste para titulares: `#0f172a` (Slate 900).
  - Tono secundario legible: `#475569` (Slate 600).
  - Metadatos sutiles: `#64748b` (Slate 500).
  - Jamás usar gris claro (`#999` o `#aaa`) sobre fondos blancos para textos legibles.

### B. Micro-Detalles que Crean "Craft"
- **Insignias y Badges:**
  - Fondo translúcido con tinte de color (`rgba(0, 82, 255, 0.08)`).
  - Texto con peso 600 y tamaño micro (`0.7rem - 0.75rem`).
  - Borde sutil del mismo tono (`1px solid rgba(0, 82, 255, 0.18)`).
- **Interacciones Táctiles:**
  - Hover con elevación suave de `-1px` o `-2px` en `translateY`.
  - Transición rápida en `transform` y `box-shadow` usando curvas cúbicas naturales.
  - Active press feedback con micro-escala (`scale(0.98)`).

### C. Alineación Óptica y Densidad
- Las etiquetas de formulario siempre van a `0.35rem - 0.45rem` del input, no flotando en el vacío.
- Los iconos dentro de botones o badges deben estar ópticamente centrados respecto al texto que los acompaña.
- Agrupación por proximidad: La información relacionada se empaqueta junta con menor separación que los grupos adyacentes.

---

## 3. Checklist de Evaluación Rápida (Taste Audit)

Antes de finalizar una interfaz o componente, verifica:
- [ ] ¿Hay coherencia en la escala de tipografía (un solo conjunto de tamaños armónicos)?
- [ ] ¿Los botones tienen tamaño cómodo sin desbordar el contenedor?
- [ ] ¿Los estados interactivos (Hover, Active, Focus, Disabled) están definidos y pulidos?
- [ ] ¿Las sombras son multidimensionales y suaves en lugar de una mancha negra?
- [ ] ¿El diseño se adapta de forma fluida a dispositivos móviles y pantallas estrechas?
