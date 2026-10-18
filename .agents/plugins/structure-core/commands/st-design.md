---
description: Convert Figma/CSS into project tokens, or update DESIGN.md
argument-hint: [paste CSS, or describe the change]
---

Handle a design-token task: **$ARGUMENTS**

Use the `design-tokens` skill.

## If CSS was pasted

1. **Read `DESIGN.md`** and the project's theme source (the `@theme` block, `tailwind.config`,
   the theme file, or the component library's tokens) before converting anything.

2. **Discard Figma artifacts** before converting: absolute positioning produced by autolayout,
   per-child margins (the parent gets a `gap`), `font-family` repeated on every node, fixed
   container widths that should be fluid.

3. **Convert in strict preference order:**
   built-in utility → existing project token → new project token → arbitrary value → custom CSS.

   Snap near-duplicate colors to the existing token and say that you snapped. A new token gets
   added to both `DESIGN.md` and the theme in the same change, and is worth mentioning rather
   than doing silently. An arbitrary value needs a stated reason — three in one component means
   there is a token you have not captured, so stop and add it.

4. **Report** the conversion, the tokens added, and any value you snapped or questioned.

## If asked to update DESIGN.md

Make the change in `DESIGN.md` and in the theme source together — they must not diverge. If
the project supports dark mode, a new color token without its dark counterpart is incomplete.

## If DESIGN.md does not exist yet

Extract the de facto tokens from the existing UI code first — the theme block, CSS custom
properties, the most frequently used utilities — present that as the detected baseline, and
ask whether to codify or revise. Codifying what already exists is usually right; revising is
a design project the user should opt into deliberately.

If the repo has no UI at all, say so and stop.
