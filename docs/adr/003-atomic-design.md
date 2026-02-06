# ADR 003: Atomic Design Component Hierarchy

## Status

Accepted

## Context

With 70+ React components, the frontend needed an organizational system to manage complexity, enforce boundaries, and make the component library discoverable. The codebase also uses Storybook for component documentation, which benefits from a clear hierarchy.

## Decision

Organize frontend components using **Atomic Design** methodology with four levels:

| Level | Directory | Purpose | Import Rules |
|-------|-----------|---------|-------------|
| **Atoms** | `components/atoms/` | Basic UI primitives (Icon, Badge, Button, Tooltip) | External libs, other atoms, utils only |
| **Molecules** | `components/molecules/` | Composed building blocks (NavChannel, MessageBody, Emoji) | Atoms + other molecules |
| **Organisms** | `components/organisms/` | Complex feature sections (Input, Message, Sidebar, Conversation) | Atoms + molecules |
| **Pages** | `components/pages/` | Full-page views (LoginPage, ErrorPage, RegistrationPage) | Any component level |

Supporting directories sit alongside: `contexts/`, `hooks/`, `layout/`.

Storybook stories mirror this hierarchy with category prefixes (`Atoms/Badge`, `Molecules/NavChannel`, `Pages/LoginPage`).

## Consequences

- **Positive:** Clear component discoverability — developers know where to find and place components.
- **Positive:** Natural Storybook organization — stories grouped by atomic level.
- **Positive:** Enforced dependency direction — atoms are reusable, organisms compose them.
- **Positive:** Import rule violations are lintable (via `no-restricted-imports`).
- **Negative:** Classification disputes — some components sit on boundaries between levels.
- **Negative:** Moving a component between levels requires updating all import paths.
- **Negative:** The four-level hierarchy is rigid; some components don't fit neatly.
