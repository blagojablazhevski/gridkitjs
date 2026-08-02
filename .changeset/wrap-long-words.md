---
"@gridkitjs/theme-tailwind": patch
---

A column with `wrap` enabled now breaks a word longer than the column instead
of overflowing it — `white-space: normal` alone only breaks at spaces, so a
long unbroken token (a URL, a long identifier) previously spilled past the
column's fixed width.
