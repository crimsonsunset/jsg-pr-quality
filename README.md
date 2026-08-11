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

Config packages + CLI are npm workspaces. First public publish:

```bash
npm publish -w @crimsonsunset/eslint-config --access public
npm publish -w @crimsonsunset/prettier-config --access public
npm publish -w @crimsonsunset/cspell-config --access public
npm publish -w @crimsonsunset/tsconfig-base --access public
npm publish -w @crimsonsunset/pr-quality-cli --access public
```

Tag the hub after the reusable workflows are stable:

```bash
git tag v1
git push origin v1
```
