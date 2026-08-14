# PR review standards (__REPO_NAME__)

Human review notes. Deterministic gates (ESLint, Prettier, cspell, knip, Semgrep,
gitleaks, audit) own formatting and security scanners. Review comments should
not duplicate those.

## Prefer

- Early returns over deep nesting; no nested ternaries
- Concrete, minimal diffs for suggestions
- Calling out real defect classes (async/promise misuse, missing error handling, API contract breaks)

## Avoid

- Formatting / import-order / naming nits already covered by lint
- Drive-by refactors unrelated to the PR diff
- Weakening shared hub rules to silence findings

## Repo-specific hard rules

Add conventions that are unique to this codebase below (path aliases, filename
suffixes, framework constraints, etc.).
