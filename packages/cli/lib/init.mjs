import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildKnipConfig, deriveKnipEntry } from './knip-entry.helpers.mjs';
import { deriveRepoIdentity, renderReviewStandards } from './repo-identity.helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const BASE_DEV_DEPS = {
  '@crimsonsunset/eslint-config': '^0.1.0',
  '@crimsonsunset/prettier-config': '^0.1.0',
  '@crimsonsunset/cspell-config': '^0.1.0',
  '@crimsonsunset/knip-config': '^0.1.0',
  '@eslint/js': '^10.0.0',
  eslint: '^10.0.0',
  // eslint-config-prettier is a dependency of @crimsonsunset/eslint-config — do
  // not re-add it here; knip flags the direct consumer copy as unused.
  'eslint-plugin-import-x': '^4.0.0',
  'eslint-plugin-n': '^17.0.0',
  // unopinionated preset exists only since unicorn 61; hub validates on ^73.
  'eslint-plugin-unicorn': '^73.0.0',
  prettier: '^3.0.0',
  // typescript-eslint's tseslint.config() wrapper is used by the eslint config
  // template regardless of TS usage — it's a plain flat-config array composer.
  'typescript-eslint': '^8.0.0',
  cspell: '^10.0.0',
  knip: '^5.0.0',
};

const TYPESCRIPT_DEV_DEPS = {
  '@crimsonsunset/tsconfig-base': '^0.1.0',
  typescript: '^5.0.0',
};

const CHECKJS_DEV_DEPS = {
  typescript: '^5.0.0',
};

const BASE_SCRIPTS = {
  'lint:eslint': 'eslint .',
  'lint:cspell': 'cspell "**/*.{ts,tsx,mjs,js,md,json}" --no-progress',
  'lint:knip': 'knip',
  format: 'prettier --write .',
  'format:check': 'prettier --check .',
  'ci:lint': 'node scripts/ci/lint.script.mjs',
  'ci:test': 'node scripts/ci/test.script.mjs',
};

const TYPESCRIPT_SCRIPTS = {
  'lint:tsc': 'tsc --noEmit',
};

const BUILD_SCRIPTS = {
  'lint:build': 'npm run build',
};

/**
 * ponytail: bounded recursive scan, skips the usual heavy directories.
 * Ceiling: won't see .ts files nested more than 6 levels deep, or inside a
 * custom build/output dir not in the skip list. Fine for detecting "does this
 * repo use TypeScript at all"; not a general-purpose file walker.
 * @param {string} dir
 * @param {number} depth
 * @returns {boolean}
 */
function hasTsFiles(dir, depth = 0) {
  if (depth > 6) return false;
  const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      if (hasTsFiles(path.join(dir, entry.name), depth + 1)) return true;
    } else if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) {
      return true;
    }
  }
  return false;
}

/**
 * Detects whether the target repo already uses TypeScript, so `init` can skip
 * writing tsconfig.json / lint:tsc for plain-JS repos.
 * @param {string} cwd
 * @returns {boolean}
 */
function detectTypeScript(cwd) {
  if (fs.existsSync(path.join(cwd, 'tsconfig.json'))) return true;
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.devDependencies?.typescript ?? pkg.dependencies?.typescript) return true;
  }
  return hasTsFiles(cwd);
}

/**
 * @typedef {object} InitOptions
 * @property {string} cwd
 * @property {boolean} force
 * @property {boolean} dryRun
 * @property {boolean} jsTypecheck
 */

/**
 * Detects npm vs pnpm from lockfiles in the target directory.
 * @param {string} cwd
 * @returns {'npm' | 'pnpm'}
 */
function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
}

/**
 * Reads a template file from packages/cli/templates.
 * @param {string} name
 * @returns {string}
 */
function readTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8');
}

/**
 * Writes a file unless it already exists (or --force). Honors --dry-run.
 * @param {string} filePath
 * @param {string} contents
 * @param {InitOptions} opts
 * @returns {'wrote' | 'skipped' | 'would-write'}
 */
function writeFileSafe(filePath, contents, opts) {
  const exists = fs.existsSync(filePath);
  if (exists && !opts.force) {
    console.log(`skip  ${path.relative(opts.cwd, filePath)} (exists, use --force)`);
    return 'skipped';
  }
  if (opts.dryRun) {
    console.log(`write ${path.relative(opts.cwd, filePath)} (dry-run)`);
    return 'would-write';
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
  console.log(`write ${path.relative(opts.cwd, filePath)}`);
  return 'wrote';
}

/**
 * Merges missing scripts/devDeps into package.json without clobbering existing keys.
 * @param {string} cwd
 * @param {InitOptions} opts
 * @param {'npm' | 'pnpm'} packageManager
 * @param {boolean} hasTypeScript
 * @param {boolean} enableJsTypecheck
 * @returns {Record<string, unknown>}
 */
function updatePackageJson(cwd, opts, packageManager, hasTypeScript, enableJsTypecheck) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error('No package.json found. Run npm init / pnpm init first.');
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts ?? {};
  pkg.devDependencies = pkg.devDependencies ?? {};

  /** @type {Record<string, string>} */
  const scripts = { ...BASE_SCRIPTS };
  /** @type {Record<string, string>} */
  const devDeps = { ...BASE_DEV_DEPS };

  if (hasTypeScript) {
    Object.assign(scripts, TYPESCRIPT_SCRIPTS);
    Object.assign(devDeps, TYPESCRIPT_DEV_DEPS);
  } else if (enableJsTypecheck) {
    Object.assign(scripts, TYPESCRIPT_SCRIPTS);
    Object.assign(devDeps, CHECKJS_DEV_DEPS);
  }

  if (pkg.scripts.build != null) {
    Object.assign(scripts, BUILD_SCRIPTS);
  }

  for (const [name, cmd] of Object.entries(scripts)) {
    if (pkg.scripts[name] == null) {
      pkg.scripts[name] = cmd;
      console.log(`script + ${name}`);
    } else {
      console.log(`script   ${name} (kept existing)`);
    }
  }

  for (const [name, version] of Object.entries(devDeps)) {
    if (pkg.devDependencies[name] == null && pkg.dependencies?.[name] == null) {
      pkg.devDependencies[name] = version;
      console.log(`dep    + ${name}@${version}`);
    } else {
      console.log(`dep      ${name} (kept existing)`);
    }
  }

  if (!pkg.prettier) {
    pkg.prettier = '@crimsonsunset/prettier-config';
    console.log('field + prettier -> @crimsonsunset/prettier-config');
  }

  // eslint-plugin-n reads engines; missing field silently validates against Node 16.
  if (!pkg.engines?.node) {
    pkg.engines = { ...pkg.engines, node: '>=22.18.0' };
    console.log('field + engines.node -> >=22.18.0');
  }

  const next = `${JSON.stringify(pkg, null, 2)}\n`;
  if (opts.dryRun) {
    console.log(`write package.json (dry-run, package-manager=${packageManager})`);
    return pkg;
  }
  fs.writeFileSync(pkgPath, next, 'utf8');
  console.log(`write package.json (package-manager=${packageManager})`);
  return pkg;
}

/**
 * Wires shared configs + thin caller workflows into the current repo.
 * Additive by default; never touches application source.
 *
 * @param {InitOptions} opts
 * @returns {Promise<void>}
 */
export async function runInit(opts) {
  const packageManager = detectPackageManager(opts.cwd);
  const hasTypeScript = detectTypeScript(opts.cwd);
  const enableJsTypecheck = Boolean(opts.jsTypecheck) && !hasTypeScript;

  if (opts.jsTypecheck && hasTypeScript) {
    console.log(
      'note: --js-typecheck ignored; TypeScript already detected (use tsconfig / lint:tsc path)\n',
    );
  }

  console.log(
    `pr-quality init (cwd=${opts.cwd}, pm=${packageManager}, typescript=${hasTypeScript}, jsTypecheck=${enableJsTypecheck}, force=${opts.force}, dryRun=${opts.dryRun})\n`,
  );

  const pkg = updatePackageJson(opts.cwd, opts, packageManager, hasTypeScript, enableJsTypecheck);

  const eslintTemplate = hasTypeScript ? 'eslint.config.type-checked.mjs' : 'eslint.config.mjs';

  /** @type {Array<[string, string]>} */
  const files = [
    [eslintTemplate, 'eslint.config.mjs'],
    ['prettierrc.json', '.prettierrc'],
    ['cspell.json', 'cspell.json'],
    ['quality.on-pr.yml', path.join('.github', 'workflows', 'quality.on-pr.yml')],
    ['lint.script.mjs', path.join('scripts', 'ci', 'lint.script.mjs')],
    ['test.script.mjs', path.join('scripts', 'ci', 'test.script.mjs')],
    ['prettierignore', '.prettierignore'],
  ];

  if (hasTypeScript) {
    files.splice(3, 0, ['tsconfig.json', 'tsconfig.json']);
  } else if (enableJsTypecheck) {
    files.splice(3, 0, ['tsconfig.checkjs.json', 'tsconfig.json']);
  }

  for (const [templateName, relativePath] of files) {
    let contents = readTemplate(templateName);
    if (templateName.endsWith('.yml')) {
      contents = contents.replaceAll('__PACKAGE_MANAGER__', packageManager);
    }
    writeFileSafe(path.join(opts.cwd, relativePath), contents, opts);
  }

  const identity = deriveRepoIdentity(pkg, opts.cwd);
  writeFileSafe(
    path.join(opts.cwd, '.github', 'review-standards.md'),
    renderReviewStandards(readTemplate('review-standards.md'), identity),
    opts,
  );

  const knipCandidates = [
    'knip.json',
    'knip.jsonc',
    '.knip.json',
    'knip.js',
    'knip.ts',
    'knip.config.js',
    'knip.config.ts',
    'knip.config.mjs',
  ];
  const existingKnip = knipCandidates.find((name) => fs.existsSync(path.join(opts.cwd, name)));
  if (existingKnip && !opts.force) {
    console.log(`skip  knip.config.js (${existingKnip} exists, use --force)`);
  } else {
    if (existingKnip && opts.force && existingKnip !== 'knip.config.js') {
      console.log(
        `note: writing knip.config.js; remove ${existingKnip} if knip still picks it up first`,
      );
    }
    const entry = deriveKnipEntry(pkg, opts.cwd);
    writeFileSafe(path.join(opts.cwd, 'knip.config.js'), buildKnipConfig(entry), opts);
    if (entry.length === 0) {
      console.log(
        'note: knip entry is empty — knip plugin inference may still work; add entry paths if needed',
      );
    }
  }

  if (enableJsTypecheck) {
    console.log(`
warning: --js-typecheck enables allowJs/checkJs. Existing untyped JS often
produces a large first-run finding set; treat cleanup as part of adoption.
`);
  }

  console.log(`
Done.
Next:
  1. ${packageManager === 'pnpm' ? 'pnpm install' : 'npm install'}
  2. Layer any repo-specific ESLint/tsconfig/knip overrides on top of the stubs
  3. Layer .github/review-standards.md with this repo's hard rules
  4. Open a PR to confirm the sticky quality report fires
`);
}
