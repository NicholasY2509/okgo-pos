# Design

The visual contract for this repository. Any value in the code that contradicts this file is a defect.

> Maintained under Structure. Add a token here in the same change that introduces it in code.
> Never hardcode a value this file could name.

## Foundations

- **Styling system:** <!-- TODO: Tailwind v4 / CSS Modules / styled-components / component library -->
- **Theme source of truth:** <!-- TODO: path to the @theme block, theme file, or config -->
- **Color modes:** <!-- TODO: light only / dark only / both -->
- **Base unit:** <!-- TODO: 4px / 8px grid -->

## Color

Semantic names, not raw hex, are what code refers to.
<!-- TODO: fill values. Include a dark column only if the project supports dark mode. -->

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `primary` | | | Primary actions, active state |
| `primary-foreground` | | | Text on primary |
| `background` | | | Page background |
| `surface` | | | Cards, panels, raised areas |
| `border` | | | Dividers, input borders |
| `foreground` | | | Body text |
| `muted-foreground` | | | Secondary text, labels |
| `success` | | | |
| `warning` | | | |
| `danger` | | | Destructive actions, errors |

**Rules**
- Never introduce a hex that is a near-duplicate of an existing token — snap to the token.
- Opacity uses the framework's slash syntax, not a separate opacity utility.
- <!-- TODO: any project-specific color rules -->

## Typography

- **Font families:** <!-- TODO: display / body / mono, with fallback stacks -->

| Role | Size | Weight | Line height | Utility |
| --- | --- | --- | --- | --- |
| Display | | | | |
| H1 | | | | |
| H2 | | | | |
| H3 | | | | |
| Body | | | | |
| Body small | | | | |
| Caption | | | | |
| Label | | | | |

## Spacing

Scale: <!-- TODO: e.g. 4px steps, utilities are px ÷ 4 -->

| Context | Value |
| --- | --- |
| Page gutter | |
| Section gap | |
| Card padding | |
| Form field gap | |
| Inline element gap | |

**Rule:** spacing between siblings uses `gap` on the parent, not margins on the children.

## Radius, borders, elevation

| Token | Value | Used for |
| --- | --- | --- |
| Radius — control | | Buttons, inputs |
| Radius — container | | Cards, panels |
| Radius — full | | Pills, avatars |
| Border width | | |
| Shadow — subtle | | Cards at rest |
| Shadow — raised | | Dropdowns, popovers |
| Shadow — overlay | | Modals |

## Breakpoints

<!-- TODO: the project's breakpoints and whether the design is mobile-first. -->

| Name | Min width | Notes |
| --- | --- | --- |
| | | |

## Component conventions

Every appearance that must stay consistent is recorded here. Add a row the second time a
pattern is used, so the third use follows it.

<!-- TODO: rules that apply across components — button sizing, input heights,
     focus ring treatment, disabled state, loading state, empty state, icon sizing. -->

| Concern | Rule |
| --- | --- |
| Focus ring | |
| Disabled state | |
| Loading state | |
| Empty state | |
| Icon size | |
| Touch target minimum | |

## Motion

<!-- TODO: durations, easing, and what is animated. Delete if the project has no motion system. -->

## Figma

- **File:** <!-- TODO: link -->
- **Conversion rule:** built-in utility → existing token → new token → arbitrary value → custom CSS.
  Arbitrary values need a stated reason. Three in one component means a missing token.
- Discard from Figma output: absolute positioning from autolayout, per-child margins
  (use parent `gap`), repeated `font-family`, and fixed container widths.
