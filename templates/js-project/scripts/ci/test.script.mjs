#!/usr/bin/env node

/**
 * CI test runner.
 * Resolves a test runner from the repo, reports passed / failed / none
 * (no test files), and writes a summary to $GITHUB_OUTPUT.
 * Exit 0 for passed and none; exit 1 only when a suite ran and failed.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {'passed' | 'failed' | 'none'} TestStatus
 */

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.turbo']);

/**
 * Writes a single-line key=value pair to $GITHUB_OUTPUT.
 * @param {string} name
 * @param {string} value
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  fs.appendFileSync(outputFile, `${name}=${value}\n`);
}

/**
 * Writes a multiline value to $GITHUB_OUTPUT using the heredoc delimiter syntax.
 * @param {string} name
 * @param {string} value
 */
function setMultilineOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  const delimiter = `ghdelim_${Date.now()}`;
  fs.appendFileSync(outputFile, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}

/**
 * Returns true when a path looks like a test file or lives under __tests__.
 * @param {string} filePath
 * @returns {boolean}
 */
function isTestFile(filePath) {
  const base = path.basename(filePath);
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(base)) return true;
  return filePath.split(path.sep).includes('__tests__');
}

/**
 * ponytail: bounded recursive scan for test files.
 * Ceiling: depth 8 and the skip-dir list; enough to decide "suite exists"
 * without becoming a general-purpose file walker.
 * @param {string} dir
 * @param {number} depth
 * @returns {boolean}
 */
function hasTestFiles(dir, depth = 0) {
  if (depth > 8) return false;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (hasTestFiles(full, depth + 1)) return true;
    } else if (isTestFile(full)) {
      return true;
    }
  }
  return false;
}

/**
 * Picks a test command from package.json deps / scripts.
 * @param {Record<string, unknown>} pkg
 * @returns {{ label: string, command: string, args: string[] }}
 */
function resolveRunner(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.vitest) {
    return { label: 'vitest', command: 'npx', args: ['vitest', 'run'] };
  }
  if (deps.jest) {
    return { label: 'jest', command: 'npx', args: ['jest'] };
  }
  if (pkg.scripts?.test) {
    return { label: 'npm test', command: 'npm', args: ['test'] };
  }
  return { label: 'node --test', command: 'node', args: ['--test'] };
}

/**
 * Formats status for the sticky markdown table.
 * @param {TestStatus} status
 * @returns {string}
 */
function statusLine(status) {
  if (status === 'passed') return 'Passed';
  if (status === 'none') return 'None found';
  return '**Failed**';
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const foundTests = hasTestFiles(process.cwd());

/** @type {TestStatus} */
let status;

if (foundTests) {
  const runner = resolveRunner(pkg);
  console.log(`\n--- tests (${runner.label}) ---`);
  const result = spawnSync(runner.command, runner.args, { stdio: 'inherit', shell: false });
  status = (result.status ?? 1) === 0 ? 'passed' : 'failed';
} else {
  status = 'none';
  console.log('No test files found (*.test.*, *.spec.*, __tests__/). Reporting none.');
}

setOutput('status', status);

const summary = [
  '### Tests',
  '',
  `| Check | Status |`,
  `| --- | --- |`,
  `| Tests | ${statusLine(status)} |`,
].join('\n');

setMultilineOutput('summary', summary);

if (status === 'failed') {
  console.error('\n--- Tests failed. See above for details. ---');
  process.exit(1);
}

if (status === 'none') {
  console.log('\n--- No tests found (non-blocking). ---');
} else {
  console.log('\n--- All tests passed. ---');
}
