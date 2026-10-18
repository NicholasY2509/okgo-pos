---
name: design-tokens
description: Maintain DESIGN.md — the typography, color, spacing, radius, and shadow contract for a repository — and translate pasted Figma or raw CSS into the project's styling system. Use when the user pastes CSS from Figma, asks to match a design or a mockup, adjusts spacing, font size, or color, mentions design tokens, style guide, or px values, or runs /st-design. Prefers built-in framework utilities over custom classes.
---

# Design Tokens

`DESIGN.md` is the single source of truth for what things look like. A value that contradicts it is a defect, and a value that is not in it is a decision nobody made.

## Creating DESIGN.md

**If the repo has UI code**, extract the de facto tokens before asking anything: the Tailwind `@theme` block or `tailwind.config`, CSS custom properties, the most frequently used utility classes, the component library's theme. Present that as the detected baseline and ask whether to codify or revise. Codifying what exists is almost always right.

**If the repo is greenfield**, ask — see the `project-governance` skill's interview reference. Prefer asking for a pasted Figma frame over abstract questions; real values beat remembered ones.

Template: `${CLAUDE_PLUGIN_ROOT}/templates/DESIGN.md`.

## Translating Figma CSS

When the user pastes CSS from Figma, do not transcribe it literally. Figma emits absolute values with no knowledge of the project's scale, and a literal transcription produces exactly the hardcoded values `engineering-standards` forbids.

The order of preference is strict:

**1. A built-in utility from the framework's default scale.** Always first choice.
```
padding: 16px          →  p-4
font-size: 14px        →  text-sm
border-radius: 8px     →  rounded-lg
gap: 24px              →  gap-6
```

**2. An existing project token** defined in `DESIGN.md` / `@theme` / the component library.
```
color: #3B82F6         →  text-primary      (if primary is #3B82F6)
```

**3. A new project token**, when the value is part of the design system and will recur. Add it to `DESIGN.md` and the theme in the same change. This is a small design decision — mention it, do not just do it silently.

**4. An arbitrary value**, only when the value is genuinely one-off and non-systematic.
```
width: 60.5px          →  w-[60.5px]
```
An arbitrary value is a last resort and deserves a one-line reason. If you reach for the third arbitrary value in the same component, the design has a scale you have not captured — stop and add the token.

**5. Custom CSS** — only when no utility can express it: complex gradients, keyframes, `clip-path`, intricate selectors. Keep it adjacent to the component, never in a global stylesheet unless the project's convention is global stylesheets.

Never do this: emit `style="padding: 16px"` inline, or write a custom class that duplicates a built-in utility.

Full conversion tables and the traps: `references/figma-css-to-tailwind.md`.

## Reading Figma output critically

Figma CSS is a description of one rendered frame, not a specification. Before converting, discard what is not real:

- `position: absolute` with `left`/`top` — Figma's autolayout artifact. Use flex or grid.
- Fixed `width`/`height` on containers — usually should be intrinsic or fluid. Fixed sizes on icons and avatars are usually real.
- `font-family` repeated on every node — set once at the root.
- Exact `line-height` in px — convert to the project's leading scale unless the design depends on precise alignment.
- Colors that are one hex step from an existing token — snap to the token. Do not add `#3B82F7` next to `#3B82F6`.

When the design and the existing token disagree by a trivial amount, snap to the token and say you did. When they disagree meaningfully, ask which wins.

## Non-Tailwind projects

The same preference order applies with different targets:

- **CSS Modules / plain CSS** — CSS custom properties from `DESIGN.md` first, literals last.
- **styled-components / Emotion** — theme object values first.
- **A component library** (Mezzanine, MUI, shadcn) — the library's own props and theme tokens first, overrides last. Overriding a component's internals is an ADR-level decision; note it rather than doing it casually.

## Keeping DESIGN.md true

Update it in the same change whenever a token is added, changed, or retired.

Tokens are not the whole contract. When a component appearance repeats — the second card,
modal, table, or form built the same way — record its convention under **Component
conventions** in the same change, so the next one matches it instead of approximating it.
Before building a UI element, check that section first and follow what it says. When you notice a hardcoded value in code that contradicts `DESIGN.md`, report it; fix it if it is in the code you are already touching, otherwise note it in `LOG.md`.

Dark mode: if the project supports it, every color token needs its pair, and a new token without a dark counterpart is incomplete work.
