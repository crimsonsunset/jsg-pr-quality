import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * @typedef {object} RepoIdentity
 * @property {string} name Short app name for OpenRouter X-Title / X-OpenRouter-Title
 * @property {string} url HTTPS GitHub (or other) URL for HTTP-Referer
 * @property {'git-remote' | 'package.json' | 'cwd'} source Where the identity was derived
 */

/**
 * Normalizes a git remote or package repository URL to https://host/owner/repo.
 * @param {string} raw
 * @returns {string | null}
 */
export function normalizeRepoUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let url = raw
    .trim()
    .replace(/^git\+/, '')
    .replace(/\.git$/, '');
  const ssh = url.match(/^git@([^:]+):(.+)$/);
  if (ssh) {
    url = `https://${ssh[1]}/${ssh[2]}`;
  }
  if (url.startsWith('github:')) {
    url = `https://github.com/${url.slice('github:'.length)}`;
  }
  if (!/^https?:\/\//i.test(url)) return null;
  return url.replace(/\/+$/, '');
}

/**
 * Short display name from a package name or directory basename.
 * @param {string} value
 * @returns {string}
 */
export function shortRepoName(value) {
  return String(value || 'repo').replace(/^@[^/]+\//, '');
}

/**
 * Tries `git remote get-url origin` in cwd.
 * @param {string} cwd
 * @returns {string | null}
 */
function gitOriginUrl(cwd) {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return normalizeRepoUrl(remote);
  } catch {
    return null;
  }
}

/**
 * Reads repository / homepage fields from package.json.
 * @param {Record<string, unknown>} pkg
 * @returns {string | null}
 */
function packageRepoUrl(pkg) {
  const repo = pkg.repository;
  if (typeof repo === 'string') return normalizeRepoUrl(repo);
  if (repo && typeof repo === 'object' && typeof repo.url === 'string') {
    return normalizeRepoUrl(repo.url);
  }
  if (typeof pkg.homepage === 'string' && pkg.homepage.includes('github.com')) {
    return normalizeRepoUrl(pkg.homepage.replace(/#.*$/, ''));
  }
  return null;
}

/**
 * Derives the OpenRouter app attribution identity for a consumer repo.
 * Prefer git origin, then package.json repository, then cwd basename.
 * @param {Record<string, unknown>} pkg
 * @param {string} cwd
 * @returns {RepoIdentity}
 */
export function deriveRepoIdentity(pkg, cwd) {
  const fromGit = gitOriginUrl(cwd);
  if (fromGit) {
    const name = shortRepoName(fromGit.split('/').pop() || path.basename(cwd));
    return { name, url: fromGit, source: 'git-remote' };
  }

  const fromPkg = packageRepoUrl(pkg);
  if (fromPkg) {
    const name = shortRepoName(
      typeof pkg.name === 'string' ? pkg.name : fromPkg.split('/').pop() || path.basename(cwd),
    );
    return { name, url: fromPkg, source: 'package.json' };
  }

  const name = shortRepoName(typeof pkg.name === 'string' ? pkg.name : path.basename(cwd));
  return {
    name,
    url: `https://github.com/crimsonsunset/${name}`,
    source: 'cwd',
  };
}

/**
 * Fills `__REPO_NAME__` / `__REPO_URL__` placeholders in a .pr_agent.toml template.
 * @param {string} template
 * @param {RepoIdentity} identity
 * @returns {string}
 */
export function renderPrAgentToml(template, identity) {
  return template
    .replaceAll('__REPO_NAME__', identity.name)
    .replaceAll('__REPO_URL__', identity.url);
}

/**
 * Fills `__REPO_NAME__` in a review-standards.md template.
 * @param {string} template
 * @param {RepoIdentity} identity
 * @returns {string}
 */
export function renderReviewStandards(template, identity) {
  return template.replaceAll('__REPO_NAME__', identity.name);
}

// ponytail: one assert-style check; ceiling = no git fixture, only pure helpers.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const normalized = normalizeRepoUrl('git@github.com:crimsonsunset/demo-repo.git');
  if (normalized !== 'https://github.com/crimsonsunset/demo-repo') {
    throw new Error(`normalizeRepoUrl failed: ${normalized}`);
  }
  const rendered = renderPrAgentToml('name=__REPO_NAME__ url=__REPO_URL__', {
    name: 'demo-repo',
    url: 'https://github.com/crimsonsunset/demo-repo',
    source: 'cwd',
  });
  if (!rendered.includes('demo-repo') || !rendered.includes('https://github.com')) {
    throw new Error(`renderPrAgentToml failed: ${rendered}`);
  }
  console.log('pr-agent-attribution.helpers: ok');
}
