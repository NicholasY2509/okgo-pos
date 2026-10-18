# Figma CSS → Tailwind

Conversion tables for the default Tailwind scale. Check the project's `@theme` block or `tailwind.config` first — a customized scale overrides everything here.

## Spacing — padding, margin, gap, width, height

The default scale is `0.25rem` (4px) per step: **utility number = px ÷ 4**.

| px | Utility | px | Utility |
|---|---|---|---|
| 0 | `0` | 24 | `6` |
| 2 | `0.5` | 28 | `7` |
| 4 | `1` | 32 | `8` |
| 6 | `1.5` | 40 | `10` |
| 8 | `2` | 48 | `12` |
| 10 | `2.5` | 56 | `14` |
| 12 | `3` | 64 | `16` |
| 14 | `3.5` | 80 | `20` |
| 16 | `4` | 96 | `24` |
| 20 | `5` | 128 | `32` |

Off-scale values (13px, 18px, 22px) are usually Figma rounding artifacts. Snap to the nearest step unless the design depends on the exact value. If a specific off-scale value recurs across the design, it is a real token — add it to `@theme`.

## Typography

| px | Utility | Default line-height |
|---|---|---|
| 12 | `text-xs` | 16px |
| 14 | `text-sm` | 20px |
| 16 | `text-base` | 24px |
| 18 | `text-lg` | 28px |
| 20 | `text-xl` | 28px |
| 24 | `text-2xl` | 32px |
| 30 | `text-3xl` | 36px |
| 36 | `text-4xl` | 40px |
| 48 | `text-5xl` | 1 |

| `font-weight` | Utility |
|---|---|
| 300 | `font-light` |
| 400 | `font-normal` |
| 500 | `font-medium` |
| 600 | `font-semibold` |
| 700 | `font-bold` |

`letter-spacing`: `-0.05em` `tracking-tighter` · `-0.025em` `tracking-tight` · `0` `tracking-normal` · `0.025em` `tracking-wide`.

Line height: prefer the size utility's default. Override with `leading-*` only when the design's rhythm actually depends on it — `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625).

## Radius

| px | Utility |
|---|---|
| 2 | `rounded-sm` |
| 4 | `rounded` |
| 6 | `rounded-md` |
| 8 | `rounded-lg` |
| 12 | `rounded-xl` |
| 16 | `rounded-2xl` |
| 24 | `rounded-3xl` |
| 9999 | `rounded-full` |

## Color

Never transcribe a hex directly. Resolve in this order:

1. Matches an existing project token → use the semantic name (`text-primary`, `bg-surface`).
2. Within a hair of an existing token → snap to it, say you snapped.
3. Matches a default Tailwind palette entry → use it (`text-slate-600`).
4. A genuine new brand color → add a named token to `@theme`, then use it.

Opacity in Tailwind v4 uses slash syntax. `rgba(59, 130, 246, 0.1)` → `bg-primary/10`. The v3 `bg-opacity-*` utilities are removed.

## Shadow

| Figma | Utility |
|---|---|
| `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` |
| `0 1px 3px rgba(0,0,0,0.1)` | `shadow` |
| `0 4px 6px rgba(0,0,0,0.1)` | `shadow-md` |
| `0 10px 15px rgba(0,0,0,0.1)` | `shadow-lg` |
| `0 20px 25px rgba(0,0,0,0.1)` | `shadow-xl` |

Figma shadows rarely match exactly. Match to the nearest step; a pixel-exact shadow is not worth an arbitrary value.

## Layout

| CSS | Tailwind |
|---|---|
| `display: flex` | `flex` |
| `flex-direction: column` | `flex-col` |
| `justify-content: space-between` | `justify-between` |
| `align-items: center` | `items-center` |
| `gap: 16px` | `gap-4` |
| `display: grid` | `grid` |
| `grid-template-columns: repeat(3, 1fr)` | `grid-cols-3` |
| `position: absolute` | `absolute` — but see below |

**Spacing between siblings uses `gap`, not margins.** Figma emits per-child margins; convert the parent to flex/grid with a gap. This is the single highest-value correction when converting Figma output.

**Discard `position: absolute` with `left`/`top`** unless the element genuinely overlaps others — a badge on an avatar, a dropdown. Figma's autolayout exports as absolute positioning by default and it does not survive real content.

## Tailwind v4 specifics

Detect v4 by an `@theme` block in a CSS file and the absence of `tailwind.config.js`.

- Config is CSS-first:
  ```css
  @theme {
    --color-primary: oklch(0.62 0.19 259);
    --spacing-18: 4.5rem;
    --font-display: "Inter", sans-serif;
  }
  ```
- Import with `@import "tailwindcss";` — the `@tailwind base/components/utilities` directives are gone.
- `corePlugins` is not supported.
- Removed utilities and their replacements: `bg-opacity-*` → `bg-black/*`, `flex-shrink-*` → `shrink-*`, `flex-grow-*` → `grow-*`, `overflow-ellipsis` → `text-ellipsis`, `decoration-slice` → `box-decoration-slice`.

## Class ordering

If the project uses `prettier-plugin-tailwindcss`, let it sort — do not hand-order. Check `.prettierrc` for `tailwindFunctions` (commonly `clsx`, `cn`, `cva`) so classes inside those helpers get sorted too.

## Conditional classes

Never build class strings by concatenation — Tailwind's scanner cannot see them and the styles get purged. Use the project's helper (`cn`, `clsx`, `cva`) with complete class names on both branches:

```ts
cn('rounded-lg px-4', isActive ? 'bg-primary text-white' : 'bg-surface text-muted')
```

Not `` `bg-${color}-500` `` — that class will not exist in the output.
