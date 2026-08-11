import tseslint from 'typescript-eslint';

const TS_FILES = ['**/*.{ts,tsx,mts,cts}'];

/**
 * typescript-eslint's type-checked presets ship most rule entries unscoped
 * (`files: null`), so applying them as-is would require type info for every
 * matched file, including the consumer's own eslint.config.mjs. Scoping each
 * entry to TS files keeps type-aware rules off plain-JS/config files without
 * requiring the consumer to remember to do it themselves.
 * @param {import('eslint').Linter.Config[]} configs
 * @returns {import('eslint').Linter.Config[]}
 */
function scopeToTsFiles(configs) {
  return configs.map((config) => ({ ...config, files: config.files ?? TS_FILES }));
}

/**
 * Opt-in type-aware rules layered on top of the base config.
 * Requires the consumer to point `languageOptions.parserOptions` at a real
 * tsconfig — this package can't assume that for plain-JS consumers, which is
 * why it isn't in the default export.
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
