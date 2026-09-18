// Release preflight: npm Trusted Publishing (OIDC) cannot CREATE a package.
//
// A Trusted Publisher is configured on a package's settings page on npmjs.com,
// which presupposes the package already exists. So the FIRST publish of a new
// @d3-polytree/* package can never be tokenless: the OIDC credential carries no
// authority to create the name, and the registry answers 404 (it masks
// authorization failures as not-found on package endpoints rather than
// disclosing existence to an unauthorized caller). The resulting
// `E404 Not Found - PUT https://registry.npmjs.org/@scope%2fname` reads like an
// outage and is buried mid-log behind every other package's success.
// Upstream limitation: https://github.com/npm/cli/issues/8544
//
// Registry existence is an exact predictor of that failure, so this probes for
// it and reports up front. It deliberately does NOT fail the release: the
// packages that DO have a Trusted Publisher must still ship, exactly as they did
// when @d3-polytree/ssr alone failed. The goal is legibility, not a new gate.
//
// It runs from the `release` script rather than as a workflow step on purpose.
// changesets/action invokes `publish:` only once versions are already bumped and
// no changesets are pending, so this fires on the publish path only — never on
// the routine push that merely opens or updates the Version Packages PR.
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registry = (process.env.npm_config_registry || 'https://registry.npmjs.org').replace(
  /\/$/,
  ''
);

// Workflow commands (::error::, ::warning::) are only picked up off stdout.
const emit = (line) => console.log(line);

// `packages:` in pnpm-workspace.yaml is a flat list of `dir/*` globs with no
// nesting or negation, so a line scan beats taking on a YAML dependency. Any
// pattern shape this does not understand is reported rather than dropped.
function workspaceGlobs() {
  const lines = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8').split('\n');
  const globs = [];
  let inPackages = false;
  for (const line of lines) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;
    const entry = line.match(/^\s+-\s*['"]?([^'"#\s]+)['"]?/);
    if (entry) globs.push(entry[1]);
    else if (line.trim() !== '') break;
  }
  return globs;
}

// Carries the directory alongside the manifest: the remediation has to name a
// real path to `cd` into, and a package's folder is not guaranteed to match the
// unscoped half of its name.
function workspacePackages() {
  const found = [];
  for (const glob of workspaceGlobs()) {
    if (!glob.endsWith('/*')) {
      emit(
        `::warning::preflight does not understand workspace pattern '${glob}'; ` +
          `packages matching it are NOT covered by the Trusted Publishing check.`
      );
      continue;
    }
    const base = join(root, glob.slice(0, -2));
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(base, entry.name);
      const manifestPath = join(dir, 'package.json');
      if (!existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      found.push({ manifest, dir: relative(root, dir) });
    }
  }
  return found;
}

function publishablePackages() {
  const config = JSON.parse(readFileSync(join(root, '.changeset', 'config.json'), 'utf8'));
  const ignored = new Set(config.ignore ?? []);
  return workspacePackages()
    .filter(({ manifest }) => manifest.name && !manifest.private && !ignored.has(manifest.name))
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

// The abbreviated packument keeps this to a few KB per package instead of
// pulling full metadata for names we only need a status code for.
async function existsOnRegistry(name) {
  const res = await fetch(`${registry}/${name.replace('/', '%2f')}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
    signal: AbortSignal.timeout(15_000)
  });
  if (res.status === 404) return false;
  if (res.ok) return true;
  throw new Error(`unexpected HTTP ${res.status}`);
}

const escape = (text) => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

function writeSummary(markdown) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) appendFileSync(file, `${markdown}\n`);
}

function remediation({ manifest, dir }) {
  return [
    `${manifest.name} has never been published, and npm Trusted Publishing cannot`,
    `create a package. Bootstrap it once; every later release is then tokenless:`,
    `  1. pnpm install --frozen-lockfile && pnpm build`,
    `  2. npm login   (Trusted Publishing is not available for this name yet)`,
    `  3. cd ${dir} && pnpm publish --access public`,
    `     Use pnpm, NOT npm — pnpm rewrites the workspace:* deps to real versions.`,
    `  4. npmjs.com -> ${manifest.name} -> Settings -> Trusted Publisher:`,
    `     repository davcs86/d3-polytree, workflow release.yml, environment EMPTY`,
    `     (release.yml declares no environment: — a value there fails the match).`
  ].join('\n');
}

const packages = publishablePackages();
const probes = await Promise.all(
  packages.map(async (pkg) => {
    try {
      return { pkg, exists: await existsOnRegistry(pkg.manifest.name) };
    } catch (error) {
      return { pkg, error };
    }
  })
);

// A probe that could not complete must never hold up a release; the publish
// itself remains the source of truth.
for (const { pkg, error } of probes.filter((probe) => probe.error)) {
  emit(
    `::warning::Trusted Publishing preflight could not reach ${registry} for ` +
      `${pkg.manifest.name} (${error.message}); skipping its check.`
  );
}

const missing = probes.filter((probe) => probe.exists === false).map((probe) => probe.pkg);
// Only probes that actually completed can be claimed as verified — an
// unreachable registry must not read as a clean bill of health.
const checked = probes.filter((probe) => probe.exists !== undefined).length;

if (missing.length === 0) {
  emit(
    checked === packages.length
      ? `Trusted Publishing preflight: all ${checked} publishable packages exist on ${registry}.`
      : `Trusted Publishing preflight: ${checked}/${packages.length} publishable packages ` +
          `verified on ${registry}; the rest could not be checked (see warnings above).`
  );
} else {
  const names = missing.map((pkg) => pkg.manifest.name);
  const one = names.length === 1;
  emit(
    `::error title=Trusted Publishing bootstrap required::` +
      escape(
        `${names.join(', ')} ${one ? 'has' : 'have'} never been published. npm Trusted ` +
          `Publishing cannot create a package, so ${one ? 'it' : 'they'} will fail with E404 ` +
          `on PUT. Every other package still publishes normally. See the job summary for ` +
          `the bootstrap steps.`
      )
  );

  writeSummary(
    [
      `### ⚠️ Trusted Publishing bootstrap required`,
      ``,
      `npm Trusted Publishing (OIDC) **cannot create a package** — a Trusted Publisher is`,
      `configured on an existing package's settings page. ${one ? 'This package' : 'These packages'}`,
      `will therefore fail with \`E404 Not Found - PUT\`, while every other package publishes`,
      `normally:`,
      ``,
      ...missing.map((pkg) => `- \`${pkg.manifest.name}@${pkg.manifest.version}\``),
      ``,
      `<details><summary>Bootstrap steps</summary>`,
      ``,
      '```sh',
      missing.map(remediation).join('\n\n'),
      '```',
      ``,
      `</details>`
    ].join('\n')
  );

  for (const pkg of missing) emit(`\n${remediation(pkg)}\n`);
  emit(
    `Continuing: the remaining ${packages.length - missing.length} package(s) publish as usual.`
  );
}
