# @gridkitjs/theme-tailwind

Tailwind v4 theme for [GridKit](https://github.com/blagojablazhevski/gridkit) —
palette tokens, dark mode and the grid's styles.

> **Early development.** The API is still moving and may break between minor
> versions.

```bash
pnpm add @gridkitjs/theme-tailwind
```

Import it after Tailwind, in the stylesheet where you import `tailwindcss`:

```css
@import "tailwindcss";
@import "@gridkitjs/theme-tailwind/styles.css";
```

That is all — `@gridkitjs/react` renders semantic class names
(`gridkit-data-grid`, `header-cell`, `grid-row`), and this stylesheet targets
them directly. Nothing needs to scan the component source.

## Dark mode

The `dark:` variant is bound to a `.dark` class rather than the OS preference,
so you drive the theme yourself:

```js
document.documentElement.classList.toggle("dark", isDark);
```

## Theming

Every colour is a CSS custom property, so overriding one is plain CSS — no
Tailwind config:

```css
:root {
  --gridkit-accent: oklch(0.6 0.17 145);
  --gridkit-line: oklch(0.9 0.01 145);
}
```

| Token                     | What it colours                 |
| ------------------------- | ------------------------------- |
| `--gridkit-surface`       | Header background               |
| `--gridkit-surface-muted` | Hover background                |
| `--gridkit-line`          | Borders                         |
| `--gridkit-hover-line`    | Cell hover outline, resize edge |
| `--gridkit-fg`            | Text                            |
| `--gridkit-fg-muted`      | Secondary text, resize grip     |
| `--gridkit-accent`        | Accent                          |

Redefine them under `.dark` to change the dark palette too.

## License

MIT © Blagoja Blazhevski
