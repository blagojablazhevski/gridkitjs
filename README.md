<p align="center">
  <img src="assets/gridkit-header.svg" alt="GridKit" width="50%">
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@gridkitjs/core"><img src="https://img.shields.io/npm/v/%40gridkitjs%2Fcore?label=Core&logo=npm" alt="Core"></a>&nbsp;
  <a href="https://www.npmjs.com/package/@gridkitjs/react"><img src="https://img.shields.io/npm/v/%40gridkitjs%2Freact?label=React&logo=npm" alt="React"></a>&nbsp;
  <a href="https://www.npmjs.com/package/@gridkitjs/theme-tailwind"><img src="https://img.shields.io/npm/v/%40gridkitjs%2Ftheme-tailwind?label=Tailwind%20Theme&logo=npm" alt="Tailwind Theme"></a>
</p>
# GridKit

Headless data-grid toolkit. pnpm monorepo, ESM-only, TypeScript 6.

Grid logic lives in `@gridkitjs/core` as plain TypeScript, so it is testable
without a DOM and reusable from a future Vue/Svelte adapter. `@gridkitjs/react`
binds that logic to React components.

## Packages

| Package                     | What it is                                                            |
| --------------------------- | --------------------------------------------------------------------- |
| `@gridkitjs/core`           | Framework-agnostic grid logic — column resolution, alignment, sizing. |
| `@gridkitjs/react`          | React components consuming `core`, styled with Tailwind utilities.    |
| `@gridkitjs/theme-default`  | Plain CSS for consumers not using Tailwind. Private, unpublished.     |
| `@gridkitjs/theme-tailwind` | Tailwind theme layer. Private, unpublished.                           |

`apps/playground` is a Vite app used to develop against. Private, never published.

## Usage

```tsx
import { defineColumnsFromRows } from "@gridkitjs/core";
import { DataGridComponent, type ColumnDefinition } from "@gridkitjs/react";

const rows = [
  { Id: 1, Application: { Id: 9, Name: "Portal" }, Cost: 1250.5 },
  { Id: 2, Application: { Id: 4, Name: "Admin" }, Cost: 87.25 },
];

type Row = (typeof rows)[number];

const columns: readonly ColumnDefinition<Row>[] = [
  ...defineColumnsFromRows(rows),
  { field: "Cost", id: "Cost.currency", type: "currency", header: "Cost" },
];

<DataGridComponent
  dataSource={rows}
  columns={columns}
  resizableColumns
  resizeMode="fit"
/>;
```

Columns can be inferred from the data with `defineColumnsFromRows`, or declared
outright — a column's `type` drives its default alignment. With
`resizableColumns`, a column edge can be dragged to resize or double-clicked to
fit its content. `resizeMode="fit"` keeps columns filling the grid; `"fixed"`
lets each keep its own width.

## Development

```bash
pnpm install
pnpm dev          # playground on http://localhost:5173
```

Packages resolve to **source** locally — `exports` points at `src/index.ts` and
is swapped to `dist` at publish time via `publishConfig`. Editing a package file
hot-reloads the playground immediately; never build to see a change.

## Tests

Vitest. Test files sit next to the code as `*.test.ts` in `src/`.

```bash
pnpm test                          # all packages
pnpm --filter @gridkitjs/core test   # one package
```

Prefer testing logic in `core`, where no DOM is required.

## Standards

CI runs exactly this, in order:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

TypeScript is `strict` with `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`; ESLint is flat config, `strictTypeChecked`;
Prettier enforces formatting. ESM only, LF line endings, Changesets for
versioning.

Requires Node 22 or newer. See [AGENTS.md](AGENTS.md) for the full contributor
guide.

## License

[MIT](LICENSE) © Blagoja Blazhevski
