---
name: rip-and-replace-ci-quality
description: Retrofit an existing repo onto crimsonsunset/jsg-pr-quality workflows and @crimsonsunset/* shared configs. Use when migrating a repo onto the PR quality hub, replacing ad-hoc lint/CI, or when the user asks to rip-and-replace CI quality.
---

# rip-and-replace-ci-quality

Migrate an **existing** repo onto [`crimsonsunset/jsg-pr-quality`](https://github.com/crimsonsunset/jsg-pr-quality).

Judgment stays with the agent. Mechanical file writes go through the Node CLI:

```bash
npx @crimsonsunset/pr-quality-cli init
# or, from a local checkout of this hub:
node /path/to/jsg-pr-quality/packages/cli/bin/pr-quality.mjs init
```

## When to use

- Repo has ad-hoc ESLint/Prettier/CI and should use the shared hub
- User asks to "adopt jsg-pr-quality", "rip and replace CI", or similar
- Do **not** use this for greenfield — copy `templates/ts-project/` instead

## Process

### 1. Survey what exists

Inspect and inventory:

- Package manager (`package-lock.json` vs `pnpm-lock.yaml`)
- Existing lint/format tooling: `eslint*`, `.prettierrc*`, `cspell*`, `tsconfig*`, `knip*`
- Existing workflows under `.github/workflows/`
- Existing `scripts/ci/*` orchestrators
- Whether `ci:lint` / `format:check` already exist in `package.json`

Report the inventory to the user before deleting anything.

### 2. Decide what is safe to remove

For each existing piece, choose one of:

| Decision         | When                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| **Remove**       | Purely superseded by `@crimsonsunset/*` or hub callers (duplicate prettier/eslint base with no unique rules) |
| **Keep + layer** | Repo-specific overrides that still matter (path aliases, plugin globals, ignore globs)                       |
| **Leave alone**  | Unrelated workflows (deploy, release, tests) — never delete those                                            |

Never delete application source. Never delete test runners or deploy workflows as part of this skill.

### 3. Tear down superseded config

Only after the user has the inventory:

1. Remove superseded config files (or leave them for `--force` overwrite)
2. Remove superseded lint-only devDeps that the shared packages replace as bases (keep peers the CLI will re-add)
3. Remove old quality/review workflow YAML that will be replaced by thin callers

### 4. Run the CLI for mechanical writes

```bash
npx @crimsonsunset/pr-quality-cli init --dry-run   # preview first
npx @crimsonsunset/pr-quality-cli init             # or --force if overwriting
```

The CLI is additive-only by default. It writes:

- config stubs extending `@crimsonsunset/*`
- `.github/workflows/quality.on-pr.yml` + `review.on-pr.yml` pinned to `@v1`
- `scripts/ci/lint.script.mjs` if missing
- missing `lint:*` / `format*` / `ci:lint` scripts + config package devDeps

### 5. Re-apply repo-specific overrides

Hand-edit the stubs the CLI wrote:

- `eslint.config.mjs` — put unique rules/ignores/globals back on top of `...base`
- `tsconfig.json` — restore `paths`, `include`, project references
- `cspell.json` — move repo vocabulary into local `words`
- `scripts/ci/lint.script.mjs` — add repo-specific checks (build, knip) if the old orchestrator had them

### 6. Verify locally

```bash
npm install   # or pnpm install
npm run format:check
npm run lint:eslint
npm run ci:lint
```

Fix failures before opening a PR. Do not weaken shared rules to paper over real issues without calling that out.

### 7. Wire secrets + open a PR

1. Ensure `OPENROUTER__KEY` exists if using `review.on-pr.yml`
2. Confirm hub tag `v1` exists on `crimsonsunset/jsg-pr-quality` (callers pin to it)
3. Confirm each caller workflow kept its `permissions` block — a called workflow
   can only narrow the caller's token, so a caller missing `pull-requests: write`
   fails at startup with `but is only allowed 'pull-requests: none'`
4. Open a PR and confirm the sticky quality report + reviewdog annotations fire

## Hard rules

- Do not free-hand rewrite caller workflow YAML when the CLI can write it
- Do not expand the CLI to delete files — teardown is this skill's job
- Do not migrate application code, rename source trees, or change package managers
- Stop and ask if a workflow file looks like it mixes quality gates with deploy/release steps

## Hub paths (this repo)

| Piece                     | Path                                          |
| ------------------------- | --------------------------------------------- |
| Reusable quality workflow | `.github/workflows/quality.reusable.yml`      |
| Reusable review workflow  | `.github/workflows/review.reusable.yml`       |
| CLI                       | `packages/cli/`                               |
| Config packages           | `packages/*-config`, `packages/tsconfig-base` |
| Greenfield template       | `templates/ts-project/`                       |
