---
"@gridkitjs/theme-tailwind": minor
---

A focus ring on the focused header or body cell, drawn in `--gridkit-accent`.
The grid is one tab stop with the arrow keys moving within it, so the ring is
the only sign of where that stop is.

Two new hooks for the styles to target: `.gridkit-sr-only`, which hides the
grid's live region visually while leaving it in the accessibility tree, and
`.header-cell.is-reorderable` for the grab affordance — every header is
focusable now, so a `tabindex` no longer picks out the ones that drag.
