import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const CONFIG_DEV_DEPS = {
  '@crimsonsunset/eslint-config': '^0.1.0',
  '@crimsonsunset/prettier-config': '^0.1.0',
  '@crimsonsunset/cspell-config': '^0.1.0',
  '@crimsonsunset/tsconfig-base': '^0.1.0',
  '@eslint/js': '^10.0.0',
  eslint: '^10.0.0',
  'eslint-config-prettier': '^10.0.0',
  prettier: '^3.0.0',
  'typescript-eslint': '^8.0.0',
  typescript: '^5.0.0',
  cspell: '^10.0.0',
};

const DEFAULT_SCRIPTS = {
  'lint:eslint': 'eslint .',
  'lint:tsc': 'tsc --noEmit',
  'lint:cspell': 'cspell "**/*.{ts,tsx,mjs,js,md,json}" --no-progress',
  format: 'prettier --write .',
  'format:check': 'prettier --check .',
  'ci:lint': 'node scripts/ci/lint.script.mjs',
};

/**
 * @typedef {object} InitOptions
 * @property {string} cwd
 * @property {boolean} force
 * @property {boolean} dryRun
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
 */
function updatePackageJson(cwd, opts, packageManager) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error('No package.json found. Run npm init / pnpm init first.');
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts ?? {};
  pkg.devDependencies = pkg.devDependencies ?? {};

  for (const [name, cmd] of Object.entries(DEFAULT_SCRIPTS)) {
    if (pkg.scripts[name] == null) {
      pkg.scripts[name] = cmd;
      console.log(`script + ${name}`);
    } else {
      console.log(`script   ${name} (kept existing)`);
    }
  }

  for (const [name, version] of Object.entries(CONFIG_DEV_DEPS)) {
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

  const next = `${JSON.stringify(pkg, null, 2)}\n`;
  if (opts.dryRun) {
    console.log(`write package.json (dry-run, package-manager=${packageManager})`);
    return;
  }
  fs.writeFileSync(pkgPath, next, 'utf8');
  console.log(`write package.json (package-manager=${packageManager})`);
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
  console.log(
    `pr-quality init (cwd=${opts.cwd}, pm=${packageManager}, force=${opts.force}, dryRun=${opts.dryRun})\n`,
  );

  updatePackageJson(opts.cwd, opts, packageManager);

  const files = [
    ['eslint.config.mjs', 'eslint.config.mjs'],
    ['prettierrc.json', '.prettierrc'],
    ['cspell.json', 'cspell.json'],
    ['tsconfig.json', 'tsconfig.json'],
    ['quality.on-pr.yml', path.join('.github', 'workflows', 'quality.on-pr.yml')],
    ['review.on-pr.yml', path.join('.github', 'workflows', 'review.on-pr.yml')],
    ['lint.script.mjs', path.join('scripts', 'ci', 'lint.script.mjs')],
    ['prettierignore', '.prettierignore'],
  ];

  for (const [templateName, relativePath] of files) {
    let contents = readTemplate(templateName);
    if (templateName.endsWith('.yml')) {
      contents = contents.replaceAll('__PACKAGE_MANAGER__', packageManager);
    }
    writeFileSafe(path.join(opts.cwd, relativePath), contents, opts);
  }

  console.log(`
Done.
Next:
  1. ${packageManager === 'pnpm' ? 'pnpm install' : 'npm install'}
  2. Layer any repo-specific ESLint/tsconfig overrides on top of the stubs
  3. Add OPENROUTER__KEY as a repo secret if you want PR-Agent review
  4. Open a PR to confirm the hub sticky report fires
`);
}
