---
"@gridkitjs/theme-tailwind": patch
---

Fixed `borders="all"` still drawing a left-edge line on the first column. The table-level `box-shadow` meant to repaint that stripped edge didn't align with `border-collapse: collapse` and left a stray line behind; the outer left/right edges are now simply left unset on the first/last cell, with nothing repainting them.
