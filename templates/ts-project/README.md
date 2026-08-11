# TypeScript project template

Copy this folder (`templates/ts-project/`) when starting a new crimsonsunset TypeScript repo.

## Bootstrap

```bash
cp -R templates/ts-project /path/to/my-new-repo
cd /path/to/my-new-repo
npm install
```

Or from an empty repo, run the init CLI against the hub once packages are published:

```bash
npx @crimsonsunset/pr-quality-cli init
```

## What you get

- Shared ESLint / Prettier / cspell / tsconfig via `@crimsonsunset/*`
- Thin caller workflows pinned to `crimsonsunset/jsg-pr-quality@v1`
- `scripts/ci/lint.script.mjs` orchestrator for the sticky PR report

## After copy

1. Rename `package.json` `name`
2. Add `OPENROUTER__KEY` repo secret if you want PR-Agent
3. Layer any repo-specific ESLint/tsconfig overrides
