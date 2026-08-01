# GridKit

Headless data-grid toolkit. pnpm monorepo, ESM-only, TypeScript 6.

## Structure

| Package                               | What belongs in it                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/core` (`@gridkitjs/core`)   | Framework-agnostic grid logic — sorting, filtering, paging. Plain TypeScript. **No React, no CSS.** |
| `packages/react` (`@gridkitjs/react`) | React components, styled with Tailwind utility classes. Consumes `core`.                            |
| `packages/theme-default`              | Plain CSS for consumers not using Tailwind. Private, unpublished.                                   |
| `apps/playground`                     | Vite app used to develop against. Private, never published.                                         |

The split is the point: logic lives in `core` so it is testable without a DOM
and reusable from a future Vue/Svelte adapter. If a feature can be written
without React, it belongs in `core`.

## Development

```bash
pnpm install
pnpm dev          # playground on http://localhost:5173
```

Packages resolve to **source** locally — `exports` points at `src/index.ts` and
is swapped to `dist` at publish time via `publishConfig`. Editing a package file
hot-reloads the playground immediately; never build to see a change.

To add a component: write it in `packages/react/src/`, export it from
`packages/react/src/index.ts`, use it in the playground.

Tailwind classes written inside `packages/react` only compile because
`apps/playground/src/index.css` declares `@source "../../../packages/react/src"`.
Tailwind does not scan symlinked packages by default. Any new package shipping
utility classes needs its own `@source` line.

## Tests

Vitest. Test files sit next to the code as `*.test.ts` in `src/`.

```bash
pnpm test                          # all packages
pnpm --filter @gridkitjs/core test   # one package
```

Both packages currently pass `--passWithNoTests`; drop that flag once a package
has real tests. Prefer testing logic in `core`, where no DOM is required.

## Standards

CI runs exactly this, in order:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- **TypeScript** — every tsconfig extends `tsconfig.base.json`: `strict`, plus
  `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Do not loosen
  these per package.
- **ESLint** — flat config, `strictTypeChecked`. Fix the code rather than adding
  disable comments.
- **Prettier** — double quotes, semicolons, 2-space indent, trailing commas, 80
  columns. Enforced in CI.
- **Line endings** — LF everywhere, pinned by `.gitattributes`.
- **ESM only.** No CommonJS output.
- **Versioning** — Changesets. Run `pnpm changeset` in any change that affects
  published package behaviour.

### Releasing

Two modes, both from a clean tree with `npm login` already done.

```bash
pnpm release:dev   # snapshot: 0.0.0-dev-<timestamp>, published under the `dev` tag
pnpm release       # stable: consumes changesets, publishes to `latest`
```

`release:dev` is the one to reach for while iterating. It cuts a throwaway
version off the `latest` tag, so `pnpm add @gridkitjs/core` keeps resolving to
the last stable release and only `@dev` sees the snapshot.

It rewrites versions and consumes changeset files as a side effect, so **do not
commit the tree it leaves behind** — `git checkout .` after publishing. The
changesets have to survive to drive the next stable release.

### Commits

[Conventional Commits](https://www.conventionalcommits.org):
`type(optional-scope): subject`.

**The subject is one short sentence.** Imperative mood, lowercase, no trailing
period, ideally under 72 characters. If it needs an "and", it is probably two
commits.

```
feat(react): add sortable column headers
fix(core): handle an empty row array
docs: document the tailwind source directive
chore(deps): bump vite to 8.2
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`,
`chore`, `revert`.

Scope is the package without its namespace — `core`, `react`, `theme-default`,
`playground` — and is omitted for repo-wide changes.

Breaking changes take a `!` before the colon (`feat(core)!: ...`) plus a
`BREAKING CHANGE:` footer.

**Default to no body.** Add one only when there's a genuinely non-obvious
_why_ — a bug workaround, a rejected alternative, a constraint from outside
the diff. Restating what the diff does in prose, even as a justification
("so that X can now do Y"), is still restating the diff — skip it if the
subject line and the code already make it clear.

The commit type does not drive release versions; Changesets does. The two are
independent.
