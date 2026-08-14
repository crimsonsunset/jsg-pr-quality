# jsg-pr-quality

Reusable PR quality hub for crimsonsunset repos.

- **Reusable workflows** — sticky quality report, Semgrep, gitleaks, `npm`/`pnpm` audit
- **Shareable configs** — `@crimsonsunset/eslint-config`, `prettier-config`, `cspell-config`, `tsconfig-base`, `knip-config`
- **CLI** — `npx @crimsonsunset/pr-quality-cli init` (Node) writes stubs + thin callers (knip, tests, type-aware eslint when applicable)
- **Templates** — [`templates/ts-project/`](./templates/ts-project/) (TS) and [`templates/js-project/`](./templates/js-project/) (JS + `checkJs`)
- **Skill** — [`skills/rip-and-replace-ci-quality/`](./skills/rip-and-replace-ci-quality/) for existing repos

Planning: [`docs/planning/hub-extraction-plan.md`](./docs/planning/hub-extraction-plan.md), capability hardening: [`docs/planning/quality-capability-hardening-plan.md`](./docs/planning/quality-capability-hardening-plan.md)

## Adopt (existing repo)

```bash
# Prefer the skill in Cursor, or run the CLI directly:
npx @crimsonsunset/pr-quality-cli init --dry-run
npx @crimsonsunset/pr-quality-cli init
```

Caller workflows pin to `@v1` once that tag exists on this repo.

## Adopt (new repo)

```bash
cp -R templates/ts-project /path/to/my-new-repo
cd /path/to/my-new-repo && npm install
```

## Type-aware ESLint

The CLI writes `recommended-type-checked` when it detects TypeScript. Manual shape:

```js
import base from '@crimsonsunset/eslint-config';
import recommendedTypeChecked from '@crimsonsunset/eslint-config/recommended-type-checked';
import tseslint from 'typescript-eslint';

export default tseslint.config(...base, ...recommendedTypeChecked, {
  files: ['**/*.{ts,tsx,mts,cts}'],
  languageOptions: {
    parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
  },
});
```

Stricter `strictTypeChecked` stays at `@crimsonsunset/eslint-config/type-checked`.
Plain-JS retrofits that want `checkJs`: `pr-quality-cli init --js-typecheck`.

Requires **ESLint 10+** (v9 is EOL). The base also includes `eslint-plugin-n` (Node-scoped),
`eslint-plugin-unicorn` (`unopinionated`), and `eslint-plugin-import-x`.

## Tests + knip (default-on)

`init` always writes `ci:test` + `scripts/ci/test.script.mjs` (reports **none found** when
there is no suite) and `knip.config.js` extending `@crimsonsunset/knip-config` with a
derived `entry`. Existing `knip.json` / `knip.config.*` files are left alone unless
`--force`.

## Extending shared configs with repo-specific vocabulary

`@crimsonsunset/cspell-config` only ships words genuinely shared across every hub consumer
(tool names from the reusable workflows, `tseslint`, the author's own name). Repo-specific
vocabulary goes in your own `cspell.json`, which imports the base:

```json
{
  "import": ["@crimsonsunset/cspell-config/cspell.json"],
  "words": ["yourRepoSpecificTerm"]
}
```

## Hub layout

```
.github/
  workflows/
    quality.reusable.yml   # workflow_call — deterministic gates
    self-test.on-pr.yml    # hub calls itself on PRs
  actions/setup-toolchain/ # optional composite for callers
packages/
  eslint-config/
  prettier-config/
  cspell-config/
  tsconfig-base/
  knip-config/
  cli/                     # @crimsonsunset/pr-quality-cli
templates/ts-project/
templates/js-project/
skills/rip-and-replace-ci-quality/
```

## Versioning

Callers should pin:

```yaml
uses: crimsonsunset/jsg-pr-quality/.github/workflows/quality.reusable.yml@v1
```

Do not pin callers to `@master`.

## Caller permissions (required)

Every caller workflow must declare `permissions` explicitly:

```yaml
permissions:
  contents: read
  pull-requests: write
```

A called workflow can only _narrow_ the caller's token, never widen it. If the
caller omits the block it inherits the repo default, which for most repos is
contents-only, and the run dies at startup with:

```
The workflow is requesting 'pull-requests: write', but is only allowed 'pull-requests: none'
```

The CLI and the template both write this block already. Only hand-written
callers can miss it.

## Publish (maintainers)

Publishing uses **npm Trusted Publishing (OIDC)** — same pattern as
[`jsg-logger`](https://github.com/crimsonsunset/jsg-logger). No `NPM_TOKEN`.

Workflow: [`.github/workflows/publish.yml`](./.github/workflows/publish.yml)

### First-time (packages do not exist on npm yet)

Trusted Publishing can only be configured on a package that already exists, so
the first release of each package has to be pushed by hand.

1. Local one-shot while logged in (`npm whoami`):

   ```bash
   npm publish --workspaces --access public
   ```

2. On [npmjs.com](https://www.npmjs.com), for **each** of those 5 packages →
   **Settings → Trusted Publisher → GitHub Actions**, with:

   | Field                | Value            |
   | -------------------- | ---------------- |
   | Organization or user | `crimsonsunset`  |
   | Repository           | `jsg-pr-quality` |
   | Workflow filename    | `publish.yml`    |
   | Environment name     | _(leave empty)_  |
   | Allowed actions      | `npm publish`    |

3. Future releases: bump workspace package versions, commit, then:

   ```bash
   git tag v0.1.1   # must be semver vX.Y.Z — not bare v1
   git push origin v0.1.1
   ```

   That tag triggers CI publish via OIDC.

### Actions tag (separate from npm)

Callers pin reusable workflows to `@v1`. That tag is **not** an npm release:

```bash
git tag v1
git push origin v1
```

`publish.yml` only matches `v*.*.*`, so bare `v1` will not try to publish to npm.
