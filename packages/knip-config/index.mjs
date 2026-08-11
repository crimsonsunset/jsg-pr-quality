/**
 * Shared knip `project` / `ignore` defaults.
 * Entry points are inherently per-repo — the CLI (or consumer) sets `entry`.
 */
export default {
  project: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
  ignore: ['dist/**', 'build/**', 'coverage/**', '**/*.min.js', 'vendor/**', '**/vendor/**'],
};
