#!/usr/bin/env node

import { runInit } from '../lib/init.mjs';

/**
 * Parses CLI argv into a command + flags object.
 * @param {string[]} argv
 * @returns {{ command: string, force: boolean, dryRun: boolean, jsTypecheck: boolean, help: boolean }}
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    command: args.find((a) => !a.startsWith('-')) ?? '',
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
    jsTypecheck: args.includes('--js-typecheck'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Prints usage to stdout.
 */
function printHelp() {
  console.log(`Usage: pr-quality <command> [options]

Commands:
  init    Wire shared configs + thin caller workflows into the current repo

Options:
  --force          Overwrite existing config/workflow files
  --dry-run        Preview writes without changing the filesystem
  --js-typecheck   For plain-JS repos: write allowJs/checkJs tsconfig + lint:tsc
  --help, -h       Show this help
`);
}

const opts = parseArgs(process.argv);

if (opts.help || !opts.command) {
  printHelp();
  process.exit(opts.help ? 0 : 1);
}

if (opts.command !== 'init') {
  console.error(`Unknown command: ${opts.command}`);
  printHelp();
  process.exit(1);
}

try {
  await runInit({
    cwd: process.cwd(),
    force: opts.force,
    dryRun: opts.dryRun,
    jsTypecheck: opts.jsTypecheck,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
