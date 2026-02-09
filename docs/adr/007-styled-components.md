# ADR 007: styled-components for CSS-in-JS

## Status

Accepted

## Context

The React frontend needs a styling solution that supports theming (multiple color schemes), component-scoped styles, and dynamic styles based on props. Options considered included CSS Modules, Tailwind CSS, vanilla-extract, and styled-components.

## Decision

Use **styled-components** (v6) as the CSS-in-JS solution for all frontend styling.

- Theme values are injected via `ThemeProvider` and accessed with `${({ theme }) => theme.property}`.
- Four themes defined in `themes.json`: `light`, `dark`, `test`, `dark-orange-test`.
- Transient props (`$propName`) used to pass styling values without forwarding to the DOM.
- Theme selection persisted to `localStorage`.

## Consequences

- **Positive:** Dynamic theming — switching between light/dark/custom themes at runtime without page reload.
- **Positive:** Component-scoped styles — no CSS class name collisions.
- **Positive:** Co-location — styles live next to the component logic in the same file.
- **Positive:** Full CSS power — media queries, pseudo-selectors, and animations work naturally.
- **Negative:** Runtime cost — styles are computed and injected at render time.
- **Negative:** Bundle size — styled-components adds ~15KB to the bundle.
- **Negative:** Developer tooling — generated class names are less readable in browser DevTools.
- **Negative:** Server-side rendering requires additional configuration (not currently needed for PWA).
