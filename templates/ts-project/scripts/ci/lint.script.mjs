#!/usr/bin/env node

/**
 * CI lint runner.
 * Runs each quality check individually so all checks complete even if one fails.
 * Writes a formatted summary to $GITHUB_OUTPUT.
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

const format = runNpmScript('format:check');
const eslint = runNpmScript('lint:eslint');
const typescript = runNpmScript('lint:tsc');
const cspell = runNpmScript('lint:cspell');

setOutput('format', format);
setOutput('eslint', eslint);
setOutput('typescript', typescript);
setOutput('cspell', cspell);

const blocking = [format, eslint, typescript, cspell];
const allPassed = blocking.every((r) => r === 'passed');

/**
 * Formats a check result for the sticky markdown table.
 * @param {CheckResult} result
 * @returns {string}
 */
function statusLine(result) {
  return result === 'passed' ? 'Passed' : '**Failed**';
}

const summary = [
  '### Quality',
  '',
  allPassed ? 'All blocking checks passed' : '**Quality checks failed**',
  '',
  '| Check | Status |',
  '| --- | --- |',
  `| Prettier | ${statusLine(format)} |`,
  `| ESLint | ${statusLine(eslint)} |`,
  `| TypeScript | ${statusLine(typescript)} |`,
  `| cspell | ${statusLine(cspell)} |`,
].join('\n');

setMultilineOutput('summary', summary);

if (!allPassed) {
  console.error('\n--- Lint failed. See above for details. ---');
  process.exit(1);
}

console.log('\n--- All blocking lint checks passed. ---');
