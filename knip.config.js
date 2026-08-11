/**
 * Hub-specific knip config. Template trees are scaffolding, not runtime graph.
 * In an npm workspaces monorepo, entry/project belong under `workspaces`.
 * Package entry points are inferred from each workspace package.json.
 */
export default {
  ignoreDependencies: [
    // Peer of @crimsonsunset/eslint-config; kept at root for the hub eslint install.
    'eslint-config-prettier',
  ],
  workspaces: {
    '.': {
      entry: ['scripts/**/*.mjs'],
      project: ['scripts/**/*.mjs'],
    },
    'packages/cli': {
      entry: ['lib/**/*.mjs'],
      project: ['bin/**/*.mjs', 'lib/**/*.mjs'],
    },
    'packages/eslint-config': {
      entry: ['scope-to-ts-files.mjs'],
      project: ['*.mjs'],
    },
    'packages/prettier-config': {
      project: ['*.js'],
    },
    'packages/knip-config': {
      project: ['*.mjs'],
    },
    'packages/cspell-config': {
      entry: [],
      project: [],
    },
    'packages/tsconfig-base': {
      entry: [],
      project: [],
    },
  },
};
