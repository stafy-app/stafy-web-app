# UI Guidelines

Status: empty — this doc is filled in incrementally as real design decisions get made for `stafy-web-app`, not authored upfront. Add a section here whenever a UI pattern, component convention, or design rule is decided, so it doesn't only live in chat history.

Until a section exists here, the source of truth for design tokens is `src/App.css` (the DaisyUI `"stafy"` theme):

- **Primary**: `#FF6B00` (brand orange) — actions, focus, brand
- **Neutrals**: slate scale (`--color-ink`, `--color-ink-soft`, `--color-ink-muted`, `--color-line`, `--color-surface`, `--color-surface-2`, `--color-page`)
- **Semantic**: success `#16A34A`, warning `#EAB308`, error `#DC2626`, info `#2563EB` (each with a `-soft` tint)
- **Typography**: Inter, scale from `--text-eyebrow` (11px) to `--text-display` (44px)
- **Shadows**: `--shadow-xs` through `--shadow-pop`, plus `--shadow-focus` tied to `--color-primary-ring`

## Sections to fill in as they're decided

- Component conventions (buttons, cards, tables, modals, empty states)
- Spacing / layout grid rules
- Chart styling conventions (once reports/dashboard charts are built)
- Form validation & error display patterns
- Loading / skeleton states
