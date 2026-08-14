# PR review standards (js-project-template)

House rules PR-Agent actually injects live in `AGENTS.md`. This file is human
docs. Deterministic gates (ESLint, Prettier, cspell, knip, Semgrep, gitleaks,
audit) own formatting and security scanners — review comments should not
duplicate those.

## Prefer

- Early returns over deep nesting; no nested ternaries
- Concrete, minimal diffs for suggestions
- Calling out real defect classes (async/promise misuse, missing error handling, API contract breaks)

## Avoid

- Formatting / import-order / naming nits already covered by lint
- Drive-by refactors unrelated to the PR diff
- Weakening shared hub rules to silence findings
- Inventing findings to fill ticket / security / focus-area slots
- Reporting JavaScript data races (JS is single-threaded)

## Repo-specific hard rules

Add conventions that are unique to this codebase below (path aliases, filename
suffixes, framework constraints, etc.). Mirror the ones that matter for review
into `AGENTS.md`. Keep `.pr_agent.toml` `extra_instructions` short.
