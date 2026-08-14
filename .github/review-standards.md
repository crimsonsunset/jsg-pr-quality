# PR review standards (jsg-pr-quality)

House rules PR-Agent actually injects live in `AGENTS.md`. This file is human
docs. Deterministic gates (ESLint, Prettier, cspell, knip, Semgrep, gitleaks,
audit) own formatting and security scanners — review comments should not
duplicate those.

## Prefer

- Thin shared configs with consumer-layer overrides
- Explicit `permissions` on every workflow_call caller
- SHA-pinned third-party Actions; digest-pinned containers
- Lockstep `@crimsonsunset/*` version bumps
- Orchestrator discovery (`lint:*`) over hardcoding check lists

## Avoid

- Expanding the hub into per-repo exception dumps
- Unpinned `@main` / `@latest` action refs
- Weakening shared rules to silence real findings
- Re-litigating Prettier vs ESLint formatting ownership
- Inventing findings to fill ticket / security / focus-area slots
- Reporting JavaScript data races (JS is single-threaded)
