---
"@gridkitjs/react": patch
---

Fixed a spurious `onColumnResize` "end" event firing when a resize handle's
pointer is released with no intervening move — including each of the two
clicks that make up a double-click.
