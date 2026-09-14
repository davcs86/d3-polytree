'use strict';

/*
 * Guards against F1-class defects: a relative require() whose path casing does
 * not match a real file on disk. Such a require resolves on case-insensitive
 * filesystems (macOS, Windows) but throws MODULE_NOT_FOUND on case-sensitive
 * ones (Linux, most CI runners, Docker images).
 *
 * Runs on any Node version with no dependencies, so it stays green even though
 * the legacy Grunt/Browserify/node-sass bundle no longer builds on modern Node.
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var SRC_DIRS = ['lib'];
var TRY_EXT = ['', '.js', '.json', '.scss', '.svg'];
var REQUIRE_RE = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;

function walk(dir, out) {
  fs.readdirSync(dir).forEach(function (name) {
    var full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, out);
    } else if (name.slice(-3) === '.js') {
      out.push(full);
    }
  });
  return out;
}

// Exact-case existence check: every path segment of `abs` (below ROOT) must
// appear verbatim in its parent directory listing. This reproduces Linux's
// case sensitivity even when the checker itself runs on macOS/Windows.
function existsExactCase(abs) {
  if (!fs.existsSync(abs)) {
    return false;
  }
  var rel = path.relative(ROOT, abs);
  if (rel.indexOf('..') === 0) {
    return true; // outside the repo (e.g. node_modules) — not our concern
  }
  var cur = ROOT;
  var segments = rel.split(path.sep);
  for (var i = 0; i < segments.length; i++) {
    if (fs.readdirSync(cur).indexOf(segments[i]) === -1) {
      return false;
    }
    cur = path.join(cur, segments[i]);
  }
  return true;
}

// Remove block and line comments so commented-out example requires are ignored.
// The `[^:]` guard keeps `://` in URL string literals from being treated as a
// line comment.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function resolves(fromFile, reqPath) {
  var base = path.resolve(path.dirname(fromFile), reqPath);
  var candidates = TRY_EXT.map(function (ext) { return base + ext; });
  candidates.push(path.join(base, 'index.js'));
  return candidates.some(existsExactCase);
}

var files = [];
SRC_DIRS.forEach(function (d) { walk(path.join(ROOT, d), files); });

var problems = [];
files.forEach(function (file) {
  var src = stripComments(fs.readFileSync(file, 'utf8'));
  var m;
  while ((m = REQUIRE_RE.exec(src))) {
    if (!resolves(file, m[1])) {
      problems.push({ file: path.relative(ROOT, file), reqPath: m[1] });
    }
  }
});

if (problems.length) {
  console.error('check-requires: wrong-case or unresolved relative require(s) — these break on case-sensitive filesystems (Linux/CI):');
  problems.forEach(function (p) {
    console.error('  ' + p.file + ": require('" + p.reqPath + "')");
  });
  process.exit(1);
}

console.log('check-requires: ' + files.length + ' file(s) scanned, all relative requires resolve with exact case.');
