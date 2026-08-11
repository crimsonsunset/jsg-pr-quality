import tseslint from 'typescript-eslint';
import { scopeToTsFiles } from './scope-to-ts-files.mjs';

/**
 * Opt-in `strictTypeChecked` + `stylisticTypeChecked` tier.
 * Prefer `@crimsonsunset/eslint-config/recommended-type-checked` for the
 * default-on type-aware surface; use this export only when a nontrivial share
 * of the team is highly proficient with TypeScript and wants the fuller
 * `no-unsafe-*` / `no-unnecessary-condition` set.
 *
 * Requires the consumer to point `languageOptions.parserOptions` at a real
 * tsconfig via `projectService`.
 *
 * @example
 * import base from '@crimsonsunset/eslint-config';
 * import typeChecked from '@crimsonsunset/eslint-config/type-checked';
 * export default tseslint.config(
 *   ...base,
 *   ...typeChecked,
 *   {
 *     files: ['**\/*.{ts,tsx,mts,cts}'],
 *     languageOptions: {
 *       parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
 *     },
 *   },
 * );
 */
export default tseslint.config(
  ...scopeToTsFiles(tseslint.configs.strictTypeChecked),
  ...scopeToTsFiles(tseslint.configs.stylisticTypeChecked),
);
