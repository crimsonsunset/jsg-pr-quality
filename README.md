# jsg-pr-quality

Reusable PR quality hub for crimsonsunset repos.

- **Reusable workflows** — sticky quality report, Semgrep, gitleaks, `npm`/`pnpm` audit, PR-Agent
- **Shareable configs** — `@crimsonsunset/eslint-config`, `prettier-config`, `cspell-config`, `tsconfig-base`
- **CLI** — `npx @crimsonsunset/pr-quality-cli init` (Node) writes stubs + thin callers
- **Template** — copy [`templates/ts-project/`](./templates/ts-project/) for greenfield
- **Skill** — [`skills/rip-and-replace-ci-quality/`](./skills/rip-and-replace-ci-quality/) for existing repos

Planning doc: [`docs/planning/hub-extraction-plan.md`](./docs/planning/hub-extraction-plan.md)

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

## Hub layout

```
.github/
  workflows/
    quality.reusable.yml   # workflow_call — deterministic gates
    review.reusable.yml    # workflow_call — PR-Agent
    self-test.on-pr.yml    # hub calls itself on PRs
  actions/setup-toolchain/ # optional composite for callers
packages/
  eslint-config/
  prettier-config/
  cspell-config/
  tsconfig-base/
  cli/                     # @crimsonsunset/pr-quality-cli
templates/ts-project/
skills/rip-and-replace-ci-quality/
```

## Versioning

Callers should pin:

```yaml
uses: crimsonsunset/jsg-pr-quality/.github/workflows/quality.reusable.yml@v1
```

Do not pin callers to `@master`.

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
