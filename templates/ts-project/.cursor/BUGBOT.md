# Bugbot house rules

- Zero findings is a valid review. Do not invent issues to fill a quota.
- Only report defects with a concrete failure mode visible in the diff.
- Do not report JavaScript data races. JS is single-threaded.
- Do not nitpick formatting, style, or anything ESLint / tsc / Prettier / cspell already covers.
- Prefer concrete, minimal suggestions over drive-by refactors.
- Soft-fail and log over swallowing errors in catch blocks.
- Skip lockfiles, build output, and `docs/planning/**`.
