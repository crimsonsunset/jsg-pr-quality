/**
 * Shared Prettier options for crimsonsunset repos.
 * Point `.prettierrc` / `prettier.config.js` at this package, or import the object.
 */
export default {
  // Deviations from Prettier 3's own defaults.
  singleQuote: true,
  printWidth: 100,

  // Match Prettier 3's current defaults, pinned explicitly so a future
  // Prettier major changing a default doesn't silently reformat every
  // consumer's codebase on the next `npm update`.
  semi: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'all',
  arrowParens: 'always',
  endOfLine: 'lf',
};
