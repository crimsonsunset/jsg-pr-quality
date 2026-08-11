import tseslint from 'typescript-eslint';
import { scopeToTsFiles } from './scope-to-ts-files.mjs';

/**
 * Default type-aware tier for TypeScript consumers.
 * Layers `recommendedTypeChecked` + `stylisticTypeChecked` on the base config.
 * Requires `languageOptions.parserOptions.projectService` (and usually
 * `tsconfigRootDir`) — the CLI wires that when it detects a tsconfig.
 *
 * For the stricter `strictTypeChecked` surface, import
 * `@crimsonsunset/eslint-config/type-checked` instead.
 *
 * @example
 * import base from '@crimsonsunset/eslint-config';
 * import recommendedTypeChecked from '@crimsonsunset/eslint-config/recommended-type-checked';
 * export default tseslint.config(
 *   ...base,
 *   ...recommendedTypeChecked,
 *   {
 *     files: ['**\/*.{ts,tsx,mts,cts}'],
 *     languageOptions: {
 *       parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
 *     },
 *   },
 * );
 */
export default tseslint.config(
  ...scopeToTsFiles(tseslint.configs.recommendedTypeChecked),
  ...scopeToTsFiles(tseslint.configs.stylisticTypeChecked),
);
