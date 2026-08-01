# GridKit

Headless data-grid toolkit. pnpm monorepo, ESM-only, TypeScript 6.

## Structure

| Package                                                 | What belongs in it                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/core` (`@gridkitjs/core`)                     | Framework-agnostic grid logic — sorting, filtering, paging. Plain TypeScript. **No React, no CSS.** |
| `packages/react` (`@gridkitjs/react`)                   | React components. Renders semantic class names; carries no styles of its own. Consumes `core`.      |
| `packages/theme-tailwind` (`@gridkitjs/theme-tailwind`) | The grid's stylesheet — palette tokens, dark mode, grid styles. Published.                          |
| `packages/theme-default`                                | Plain CSS for consumers not using Tailwind. Currently an empty stub. Private, unpublished.          |
| `apps/playground`                                       | Vite app used to develop against. Private, never published.                                         |

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

Styling lives in `theme-tailwind`, not in the components. `packages/react`
renders semantic class names — `gridkit-data-grid`, `header-cell`, `grid-row` —
and the theme's stylesheet targets them. Keep it that way: a Tailwind utility
written in a component would oblige every consumer to scan our source for it,
which is what `@source` used to paper over.

## Tests

Vitest. Test files sit next to the code as `*.test.ts` in `src/`.

```bash
pnpm test                          # all packages
pnpm --filter @gridkitjs/core test   # one package
```

`react` still passes `--passWithNoTests`; drop that flag once it has real
tests. Prefer testing logic in `core`, where no DOM is required.

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
- **Versioning** — Changesets. See below; a change that reaches a published
  package needs one in the same commit.

### Versioning

Every change that reaches a **published** package — `core`, `react`,
`theme-tailwind` — needs a changeset, in the same commit as the change:

```bash
pnpm changeset
```

Nothing else bumps a version. Do not hand-edit a `version` field, and do not
infer the bump from the commit type: `feat:` does not mean minor, and a `fix:`
that changes a signature is still breaking. The commit type and the release
version are independent.

**Which bump.** Pre-1.0, so `major` stays unused and breaking changes go in
`minor`:

| Bump    | When                                                                        |
| ------- | --------------------------------------------------------------------------- |
| `patch` | Behaviour unchanged for a correct caller — a bug fix, an internal refactor. |
| `minor` | New API, changed behaviour, or anything breaking. Say so in the summary.    |
| `major` | Not until 1.0.                                                              |

**What does not need one:** the playground, `theme-default` while it is
private, and anything that leaves shipped output untouched — tests, CI, README
and doc edits, tooling config. When in doubt, ask whether an installed consumer
could tell. If not, skip it.

**Writing the summary.** It becomes the changelog entry, read by someone
deciding whether to upgrade — so it is for consumers, not reviewers. Lead with
what changed for a caller. If a call site has to change, show the before and
after:

```md
---
"@gridkitjs/core": minor
---

`resolveColumnWidths` takes a `ColumnResolveOptions` object as its third
argument in place of the size defaults — `{ sizes: { width: 60 } }` where it
was `{ width: 60 }`.
```

**Which packages to list.** Only those whose own published code changed.
Dependents are bumped automatically — `updateInternalDependencies: "patch"` in
`.changeset/config.json` gives `react` a patch when `core` releases, so listing
`react` for a change made in `core` double-counts it. List `react` only when a
file under `packages/react` changed too.

A release consumes every pending changeset at once, so several small ones
across a branch are normal and preferable to one vague entry.

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
docs: document the theme's palette tokens
chore(deps): bump vite to 8.2
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`,
`chore`, `revert`.

Scope is the package without its namespace — `core`, `react`, `theme-tailwind`,
`theme-default`, `playground` — and is omitted for repo-wide changes.

Breaking changes take a `!` before the colon (`feat(core)!: ...`) plus a
`BREAKING CHANGE:` footer.

**Default to no body.** Add one only when there's a genuinely non-obvious
_why_ — a bug workaround, a rejected alternative, a constraint from outside
the diff. Restating what the diff does in prose, even as a justification
("so that X can now do Y"), is still restating the diff — skip it if the
subject line and the code already make it clear.

The commit type does not drive release versions; Changesets does. The two are
independent.
