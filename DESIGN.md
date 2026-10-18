# Design

The visual contract for this repository. Any value in the code that contradicts this file is a defect.

> Maintained under Structure. Add a token here in the same change that introduces it in code.
> Never hardcode a value this file could name.

## Foundations

- **Styling system:** Tailwind CSS v4 (`@import "tailwindcss"; @import "tw-animate-css"; @import "shadcn/tailwind.css";`)
- **Theme source of truth:** `app/globals.css` (`@theme inline` block and `:root` / `.dark` OKLCH variables)
- **Color modes:** Both Light and Dark mode supported via `next-themes` (`class="dark"`)
- **Base unit:** 4px grid; default control radius `0.625rem` (10px)

## Color Tokens

Semantic tokens mapped via CSS variables using the OKLCH color space:

| Token | Light Value | Dark Value | Used for |
| --- | --- | --- | --- |
| `primary` | `oklch(0.795 0.184 86.047)` | `oklch(0.795 0.184 86.047)` | Primary brand actions, active POS states, submit buttons |
| `primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | Text/icons on primary buttons |
| `background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Main page background |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary body typography |
| `card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Cards, dialog modals, raised surfaces |
| `card-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Text on cards |
| `popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Dropdowns, menus, tooltips |
| `popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Text inside popovers |
| `secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Secondary actions, badges, muted buttons |
| `secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | Text on secondary elements |
| `muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Table header background, subtle item rows |
| `muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary labels, descriptions, timestamps |
| `accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Hover item highlights, active selection states |
| `accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | Text on accented elements |
| `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.577 0.245 27.325)` | Error alerts, delete buttons, void transaction states |
| `border` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` | Subtle card borders, table dividers |
| `input` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` | Form input borders |
| `ring` | `oklch(0.795 0.184 86.047)` | `oklch(0.795 0.184 86.047)` | Focus outline ring |
| `sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | POS & Admin sidebar navigation background |
| `sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Sidebar text |
| `sidebar-primary` | `oklch(0.795 0.184 86.047)` | `oklch(0.795 0.184 86.047)` | Active nav item background |
| `sidebar-primary-foreground`| `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | Active nav item icon/label |

### Rules
- Never hardcode raw hex values in components (e.g. `bg-[#f59e0b]`). Always use semantic Tailwind classes: `bg-primary`, `text-muted-foreground`, `border-border`.
- Opacity adjustments must use Tailwind slash syntax: `bg-primary/10`, `text-foreground/80`.

## Typography

- **Font family:** `var(--font-sans)` (Inter / system fallback) and `var(--font-display)`.

| Role | Size | Weight | Line Height | Tailwind Class |
| --- | --- | --- | --- | --- |
| Page Title (H1) | 1.875rem (30px) | 700 (bold) | 2.25rem | `text-3xl font-bold tracking-tight` |
| Section Title (H2) | 1.5rem (24px) | 600 (semibold) | 2rem | `text-2xl font-semibold tracking-tight` |
| Card Title (H3) | 1.125rem (18px) | 600 (semibold) | 1.75rem | `text-lg font-semibold` |
| Subheading | 0.875rem (14px) | 400 (normal) | 1.25rem | `text-sm text-muted-foreground` |
| Body | 0.875rem (14px) | 400 (normal) | 1.25rem | `text-sm` |
| Body Small / Meta | 0.75rem (12px) | 400 (normal) | 1rem | `text-xs text-muted-foreground` |
| Monospace / Amount | 0.875rem (14px) | 500 (medium) | 1.25rem | `font-mono tabular-nums` |

## Spacing and Layout

- Base scale: 4px grid (e.g., `p-2` = 8px, `p-4` = 16px, `p-6` = 24px).
- Sibling spacing uses parent `gap-2`, `gap-4`, or `space-y-*`, never ad-hoc child margins.
- Tables, dialogs, and drawer sheets must support high information density for POS and cashier workflows.

## Radius & Elevation

| Token | CSS Variable | Value | Used for |
| --- | --- | --- | --- |
| Radius - sm | `--radius-sm` | `calc(var(--radius) * 0.6)` (~6px) | Badges, tags, small action buttons |
| Radius - md | `--radius-md` | `calc(var(--radius) * 0.8)` (~8px) | Input controls, select dropdowns |
| Radius - lg | `--radius-lg` | `var(--radius)` (10px) | Standard cards, modal dialogs |
| Radius - xl | `--radius-xl` | `calc(var(--radius) * 1.4)` (14px) | Kiosk panels, large containers |
| Radius - full | `rounded-full` | `9999px` | Avatars, status pills |

## Component Conventions

| Component | Convention |
| --- | --- |
| Buttons | Use `Button` primitive from `@/components/ui/button`. Default height `h-9 px-4 py-2`. Loading state shows spinner and disables button. |
| Form Fields | Controlled via `react-hook-form`. Display validation errors in `text-destructive text-sm`. |
| Data Tables | Use `@/components/ui/data-table.tsx` wrapping TanStack Table. Always include pagination, search filter, and loading skeleton. |
| Modals & Sheets | Dialogs for short forms/confirmations; Sheets (drawers) for complex multi-field entities (e.g. Product create/edit). |
| Number / Currency | Currency amounts formatted using Indonesian Rupiah (`Rp`) with `tabular-nums` alignment. |
