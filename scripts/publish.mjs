// Release publish orchestrator for the @d3-polytree/* packages.
//
// Two auth paths, chosen per package, deterministically:
//
//   Phase 1 — bootstrap NEW packages with NPM_TOKEN.
//     npm Trusted Publishing (OIDC) can only release a package once a Trusted
//     Publisher is configured on npmjs.com, and that configuration requires the
//     package to already exist on the registry. A name that has never been
//     published therefore cannot use OIDC for its first version. Any publishable
//     workspace package whose name 404s on the registry is published here with
//     the NPM_TOKEN automation token, injected into this step's subprocess ONLY.
//
//   Phase 2 — publish UPDATES via OIDC.
//     `changeset publish` runs with no token in its environment, so every
//     already-published package is released tokenlessly through Trusted
//     Publishing (OIDC), exactly as before. Because the token is absent from
//     this phase, OIDC is used regardless of npm/pnpm token-vs-OIDC precedence.
//
// `changeset publish` skips versions already on the registry, so the packages
// bootstrapped in Phase 1 are silently skipped in Phase 2 — no double publish.
// Node stdlib only — no dependencies (mirrors the repo's other scripts).
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = 'https://registry.npmjs.org';

const log = (msg) => console.log(`[release] ${msg}`);
const fail = (msg) => {
  console.error(`[release] ERROR: ${msg}`);
  process.exit(1);
};

// --- Enumerate publishable workspace packages -------------------------------
// Publishable = a real workspace package that is not private and not ignored by
// Changesets (the storybook app is both private and ignored).
const ignore = new Set(
  JSON.parse(readFileSync(join(repoRoot, '.changeset/config.json'), 'utf8')).ignore ?? []
);

let workspace;
try {
  workspace = JSON.parse(
    execFileSync('pnpm', ['ls', '-r', '--depth', '-1', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8'
    })
  );
} catch (e) {
  fail(`could not enumerate workspace packages: ${e.message}`);
}

const publishable = workspace.filter((p) => p && p.name && !p.private && !ignore.has(p.name));

// --- Classify each package: NEW (never published) vs EXISTING ---------------
// A read-only, unauthenticated metadata query. Exit 0 => the name exists on the
// registry. A clean E404 => the name has never been published (NEW). Any other
// failure (network, rate-limit, auth) is ambiguous, so we abort rather than
// risk routing a publish down the wrong auth path.
function registryHasPackage(name) {
  const res = spawnSync('npm', ['view', name, 'version', '--registry', REGISTRY], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (res.status === 0) return true;
  const out = `${res.stderr ?? ''}${res.stdout ?? ''}`;
  if (/E404|404 Not Found/i.test(out)) return false;
  fail(
    `could not determine the registry status of ${name}; aborting to avoid a mis-routed publish.\n${out.trim()}`
  );
}

const newPkgs = [];
const existingPkgs = [];
for (const p of publishable) {
  (registryHasPackage(p.name) ? existingPkgs : newPkgs).push(p);
}

log(
  `publishable: ${publishable.length} · new (token bootstrap): ${newPkgs.length} · existing (OIDC): ${existingPkgs.length}`
);
if (newPkgs.length) log(`new: ${newPkgs.map((p) => `${p.name}@${p.version}`).join(', ')}`);

// --- Phase 1: bootstrap NEW packages with NPM_TOKEN -------------------------
if (newPkgs.length) {
  const token = process.env.NPM_TOKEN;
  if (!token) {
    fail(
      `first-time publish of ${newPkgs.map((p) => p.name).join(', ')} requires a token, but ` +
        `NPM_TOKEN is not set. Add the NPM_TOKEN repository secret (an npm automation/granular ` +
        `token with publish rights on the @d3-polytree scope); OIDC cannot publish a package that ` +
        `does not exist on the registry yet.`
    );
  }

  log(`Phase 1 — publishing ${newPkgs.length} new package(s) with NPM_TOKEN`);
  const filters = newPkgs.flatMap((p) => ['--filter', p.name]);
  const res = spawnSync(
    'pnpm',
    ['publish', '-r', ...filters, '--access', 'public', '--no-git-checks'],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      // Scope the token to THIS subprocess. setup-node's .npmrc reads it from
      // NODE_AUTH_TOKEN; Phase 2 inherits an environment without it.
      env: { ...process.env, NODE_AUTH_TOKEN: token }
    }
  );
  if (res.status !== 0) fail('bootstrap publish (Phase 1) failed');

  // Changesets creates git tags only for packages IT publishes, so bootstrapped
  // packages would otherwise be untagged. Create + push their tags here (the
  // changesets/action only pushes tags it publishes itself). Non-fatal on error.
  for (const p of newPkgs) {
    const tag = `${p.name}@${p.version}`;
    spawnSync('git', ['tag', tag], { cwd: repoRoot, encoding: 'utf8' });
    const push = spawnSync('git', ['push', 'origin', `refs/tags/${tag}`], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    if (push.status !== 0) {
      log(`WARN: could not push tag ${tag}: ${(push.stderr ?? '').trim() || 'unknown error'}`);
    }
  }
}

// --- Phase 2: publish UPDATES via OIDC (no token in the environment) --------
log('Phase 2 — publishing updates via Trusted Publishing (OIDC)');
const oidcEnv = { ...process.env };
delete oidcEnv.NODE_AUTH_TOKEN; // guarantee OIDC, never the token
const publish = spawnSync('pnpm', ['exec', 'changeset', 'publish'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: oidcEnv
});
if (publish.status !== 0) fail('changeset publish (Phase 2) failed');

log('done');
