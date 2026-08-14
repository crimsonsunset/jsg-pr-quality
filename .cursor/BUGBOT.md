# Bugbot house rules

- Zero findings is a valid review. Do not invent issues to fill a quota.
- Only report defects with a concrete failure mode visible in the diff.
- Do not report JavaScript data races. JS is single-threaded.
- Do not nitpick formatting or anything ESLint / Prettier / cspell already covers.
- Keep config packages thin. Consumers layer overrides; they do not fork the base.
- Workflows stay SHA-pinned for third-party actions. No floating `@main` / `@latest`.
- Caller templates must declare permissions explicitly.
- Lockstep version bumps across workspace packages. No solo publishes.
- Skip `docs/planning/**` and generated lockfile noise.
