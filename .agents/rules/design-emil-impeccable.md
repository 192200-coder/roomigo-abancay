# Emil Kowalski + Impeccable Design Guidelines

Este documento establece las especificaciones técnicas obligatorias de animación, tipografía, micro-interacciones y ritmo espacial.

## 1. Animaciones y Micro-Interacciones (Emil Kowalski Standards)

### A. Curvas de Animación (Easings con Física)
Nunca uses `linear` para transiciones de UI. Aplica las siguientes curvas estándar:
```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring-gentle: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out-smooth: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### B. Tiempos de Transición (Perceptual Latency)
- **100ms - 150ms:** Feedbacks instantáneos (hover simple, focus outline, toggle checkbox).
- **180ms - 220ms:** Cambios de estado en botones, badges, elevación de cards.
- **280ms - 350ms:** Apertura de modales, drawers, acordeones y layouts expandibles.
- **> 400ms:** Exclusivamente para transiciones de página completas o efectos de fondo ambiental.

### C. Estados de Presión Táctil (:active state)
Todo elemento clickeable debe reaccionar físicamente a la interacción del usuario:
```css
.btn:active,
.clickable-card:active,
.checkbox-option:active {
  transform: scale(0.975);
  transition-duration: 80ms;
}
```

---

## 2. Tipografía y Alineación Óptica

1. **Jerarquía Visual Rigurosa:**
   - H1 (Hero Title): `font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.15;`
   - H2 (Section Title): `font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25;`
   - H3 / Card Titles: `font-size: 1.15rem; font-weight: 700; letter-spacing: -0.01em;`
   - Body Text: `font-size: 0.925rem; font-weight: 400; line-height: 1.6; color: #475569;`
   - Labels / Microcopy: `font-size: 0.75rem; font-weight: 600; text-transform: none; letter-spacing: 0.01em;`
2. **Números Tabulares:**
   - Toda cifra de precios, depósitos, metrajes o contadores debe usar:
     `font-feature-settings: 'tnum', 'zero';` para evitar saltos de ancho al cambiar valores.

---

## 3. Espaciado y Ritmo Espacial (Escala de 4px / 8px)

- Cada `padding`, `margin` y `gap` debe derivarse de la escala:
  `4px (0.25rem), 8px (0.5rem), 12px (0.75rem), 16px (1rem), 24px (1.5rem), 32px (2rem), 48px (3rem), 64px (4rem)`.
- **Regla del Contenedor Armónico:**
  `padding-interno = padding-exterior - radio-de-borde` o `padding-interno < padding-exterior`.

---

## 4. Elevación, Sombras Multicapa y Bordes Impeccable

Evitar sombras de un solo valor opaco. Emplear sombras multicapa con componente ambiental y focal:
```css
/* Sombra base sutil */
--shadow-layered-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 4px rgba(15, 23, 42, 0.02);

/* Sombra de tarjeta / elevación interactiva */
--shadow-layered-md: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.08);

/* Sombra modal / flotante con tinte de marca */
--shadow-layered-lg: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 20px 35px -10px rgba(0, 82, 255, 0.12);
```

- **Bordes con Reflejo de Luz (Inset Highlight):**
  Las tarjetas y modales incorporan un borde superior translúcido:
  `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), var(--shadow-layered-md);`
