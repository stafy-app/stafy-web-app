# UI Guidelines

Status: empty — this doc is filled in incrementally as real design decisions get made for `stafy-web-app`, not authored upfront. Add a section here whenever a UI pattern, component convention, or design rule is decided, so it doesn't only live in chat history.

Until a section exists here, the source of truth for design tokens is `src/App.css` (the DaisyUI `"stafy"` theme):

- **Primary**: `#FF6B00` (brand orange) — actions, focus, brand
- **Neutrals**: slate scale (`--color-ink`, `--color-ink-soft`, `--color-ink-muted`, `--color-line`, `--color-surface`, `--color-surface-2`, `--color-page`)
- **Semantic**: success `#16A34A`, warning `#EAB308`, error `#DC2626`, info `#2563EB` (each with a `-soft` tint)
- **Typography**: Inter, scale from `--text-eyebrow` (11px) to `--text-display` (44px)
- **Shadows**: `--shadow-xs` through `--shadow-pop`, plus `--shadow-focus` tied to `--color-primary-ring`

## Signed-out screens

Login, register, complete-registration and onboarding share the `src/components/auth/` kit: warm canvas with two soft brand glows, a white `rounded-[24px]` card, soft filled inputs with the brand focus ring, and a full-width pill primary button. Login and register add a dark brand panel on wide screens. Details in `docs/modules/auth.md` UI / Layout.

## UI copy

All visible text is Romanian, short, and addressed to the reader as „tu” (second person singular), in the same tone as the landing site:

- No em dash („—”) or `--` inside a sentence. Split into two sentences, or use a comma, a colon or parentheses. A lone „—” is allowed only as the empty-value placeholder in a table cell or field.
- Plain words over formal ones: „Alege”, „Setează”, „Descarcă” rather than „Selectează”, „Configurează”, „Exportă”; no „Te rog”.
- Failure messages start with „Nu am putut …” and end with a period; success toasts are a short past participle („Pontaj salvat.”).
- Romanian over English wherever a Romanian word exists, adapted rather than translated word for word: „Acasă” (not Dashboard), „angajați” (not „oameni”/roster), „funcție” (not job title), „Stare” (not Status), „Descarcă CSV” (not Export). „owner”, „Audit”, „Trial”, the plan names (Solo, Mic, Standard, Mare, Pilot) and „email”, „CSV”, „PDF” stay as they are.

## Sections to fill in as they're decided

- Component conventions (buttons, cards, tables, modals, empty states)
- Spacing / layout grid rules
- Chart styling conventions (once reports/dashboard charts are built)
- Form validation & error display patterns
- Loading / skeleton states
