#!/usr/bin/env node

/**
 * CI lint runner.
 * Discovers `format:check` and every `lint:*` script from package.json so
 * consumer-defined gates (knip, stylelint, json, custom) always run.
 * Writes a formatted summary to $GITHUB_OUTPUT.
 * Exits non-zero if any blocking check failed.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * @typedef {'passed' | 'failed'} CheckResult
 */

/**
 * @typedef {{ script: string, key: string, label: string }} CheckDef
 */

/** Known scripts: sticky-report labels and preferred run order after format:check. */
const KNOWN_CHECKS = [
  { script: 'format:check', key: 'format', label: 'Prettier' },
  { script: 'lint:eslint', key: 'eslint', label: 'ESLint' },
  { script: 'lint:tsc', key: 'typescript', label: 'TypeScript' },
  { script: 'lint:cspell', key: 'cspell', label: 'cspell' },
  { script: 'lint:knip', key: 'knip', label: 'Knip' },
  { script: 'lint:build', key: 'build', label: 'Build' },
];

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
 * Runs an npm script, streams output to the console, returns pass/fail.
 * @param {string} script
 * @returns {CheckResult}
 */
function runNpmScript(script) {
  console.log(`\n--- ${script} ---`);
  const result = spawnSync('npm', ['run', script], { stdio: 'inherit' });
  return (result.status ?? 1) === 0 ? 'passed' : 'failed';
}

/**
 * Formats a check result for the sticky markdown table.
 * @param {CheckResult} result
 * @returns {string}
 */
function statusLine(result) {
  return result === 'passed' ? 'Passed' : '**Failed**';
}

/**
 * Builds a GITHUB_OUTPUT-safe key from an unknown lint script name.
 * @param {string} script
 * @returns {string}
 */
function keyFromScript(script) {
  return script.replace(/^lint:/, '').replaceAll(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Discovers checks from package.json scripts.
 * Order: format:check, known lint:* in map order, unknown lint:* alphabetically.
 * @param {Record<string, string> | undefined} scripts
 * @returns {CheckDef[]}
 */
function discoverChecks(scripts) {
  const names = new Set(Object.keys(scripts ?? {}));
  /** @type {CheckDef[]} */
  const checks = [];

  for (const known of KNOWN_CHECKS) {
    if (names.has(known.script)) {
      checks.push(known);
    }
  }

  const knownScripts = new Set(KNOWN_CHECKS.map((check) => check.script));
  const unknown = [...names]
    .filter((name) => name.startsWith('lint:') && !knownScripts.has(name))
    .toSorted((a, b) => a.localeCompare(b));

  for (const script of unknown) {
    checks.push({
      script,
      key: keyFromScript(script),
      label: script.replace(/^lint:/, ''),
    });
  }

  return checks;
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const checks = discoverChecks(pkg.scripts);

if (checks.length === 0) {
  console.error('No format:check or lint:* scripts found in package.json.');
  process.exit(1);
}

const results = checks.map((check) => ({
  ...check,
  result: runNpmScript(check.script),
}));

for (const { key, result } of results) {
  setOutput(key, result);
}

const allPassed = results.every(({ result }) => result === 'passed');

const summary = [
  '### Quality',
  '',
  allPassed ? 'All blocking checks passed' : '**Quality checks failed**',
  '',
  '| Check | Status |',
  '| --- | --- |',
  ...results.map(({ label, result }) => `| ${label} | ${statusLine(result)} |`),
].join('\n');

setMultilineOutput('summary', summary);

if (!allPassed) {
  console.error('\n--- Lint failed. See above for details. ---');
  process.exit(1);
}

console.log('\n--- All blocking lint checks passed. ---');
