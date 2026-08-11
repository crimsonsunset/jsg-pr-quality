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
export function scopeToTsFiles(configs) {
  return configs.map((config) => ({ ...config, files: config.files ?? TS_FILES }));
}
