#!/usr/bin/env node

/**
 * CI lint runner.
 * Runs each quality check individually so all checks complete even if one fails.
 * Only runs checks whose npm script exists in package.json, so JS-only repos
 * (no tsconfig.json, no lint:tsc script) skip TypeScript cleanly.
 * Writes a formatted summary to $GITHUB_OUTPUT.
 * Exits non-zero if any blocking check failed.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * @typedef {'passed' | 'failed'} CheckResult
 */

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

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const CHECKS = [
  { key: 'format', script: 'format:check', label: 'Prettier' },
  { key: 'eslint', script: 'lint:eslint', label: 'ESLint' },
  { key: 'typescript', script: 'lint:tsc', label: 'TypeScript' },
  { key: 'cspell', script: 'lint:cspell', label: 'cspell' },
];

const results = CHECKS.filter((check) => pkg.scripts?.[check.script] != null).map((check) => ({
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
