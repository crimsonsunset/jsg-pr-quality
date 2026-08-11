import fs from 'node:fs';
import path from 'node:path';

/**
 * Collects string export targets from a package.json `exports` map.
 * @param {unknown} value
 * @param {Set<string>} out
 */
function collectExportPaths(value, out) {
  if (typeof value === 'string') {
    out.add(value);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const nested of Object.values(value)) {
    collectExportPaths(nested, out);
  }
}

/**
 * Derives knip `entry` globs from package.json + common source layouts.
 * Leaves dynamic-load repos (e.g. adapter plugins) for hand-editing.
 * @param {Record<string, unknown>} pkg
 * @param {string} cwd
 * @returns {string[]}
 */
export function deriveKnipEntry(pkg, cwd) {
  /** @type {Set<string>} */
  const entries = new Set();

  if (typeof pkg.main === 'string') entries.add(pkg.main);
  if (typeof pkg.module === 'string') entries.add(pkg.module);
  if (typeof pkg.bin === 'string') {
    entries.add(pkg.bin);
  } else if (pkg.bin && typeof pkg.bin === 'object') {
    for (const binPath of Object.values(pkg.bin)) {
      if (typeof binPath === 'string') entries.add(binPath);
    }
  }
  collectExportPaths(pkg.exports, entries);

  if (fs.existsSync(path.join(cwd, 'scripts'))) {
    entries.add('scripts/**/*.mjs');
  }

  for (const candidate of [
    'src/index.ts',
    'src/index.tsx',
    'src/index.mts',
    'src/index.cts',
    'src/index.js',
    'src/index.mjs',
    'src/index.cjs',
    'index.ts',
    'index.js',
    'index.mjs',
  ]) {
    if (fs.existsSync(path.join(cwd, candidate))) {
      entries.add(candidate);
    }
  }

  return [...entries].toSorted((a, b) => a.localeCompare(b));
}

/**
 * Builds a consumer `knip.config.js` that spreads the shared base and sets `entry`.
 * Knip has no JSON `extends` and does not load `*.mjs` config filenames — shareable
 * defaults are an ES module imported from `knip.config.js`.
 * @param {string[]} entry
 * @returns {string}
 */
export function buildKnipConfig(entry) {
  const entryLiteral = JSON.stringify(entry, null, 2);
  return `import base from '@crimsonsunset/knip-config';

export default {
  ...base,
  entry: ${entryLiteral},
};
`;
}
