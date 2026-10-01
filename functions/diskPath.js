'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Root for operator disk browsing. `PWD` when set, else process cwd.
 * @returns {string}
 */
function diskRoot () {
  return path.resolve(process.env.PWD || process.cwd());
}

/**
 * Resolve a request path under the disk root. Rejects NUL, `..`, and absolute escapes.
 * @param {string} [relPath]
 * @returns {{ ok: true, root: string, abs: string, rel: string }|{ ok: false, code: string }}
 */
function resolveContainedDiskPath (relPath) {
  const root = diskRoot();
  const raw = relPath == null ? '' : String(relPath);
  if (raw.indexOf('\0') !== -1) {
    return { ok: false, code: 'invalid' };
  }
  const abs = path.resolve(root, raw);
  const rel = path.relative(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, code: 'escape' };
  }
  return { ok: true, root, abs, rel };
}

/**
 * After lstat, refuse a symlink (or realpath) that left the disk root.
 * @param {string} abs
 * @param {string} root
 * @returns {{ ok: true, realAbs: string, realRoot: string }|{ ok: false, code: string }}
 */
function assertRealpathContained (abs, root) {
  let realAbs;
  let realRoot;
  try {
    realRoot = fs.realpathSync(root);
    realAbs = fs.realpathSync(abs);
  } catch {
    return { ok: false, code: 'not_found' };
  }
  const rel = path.relative(realRoot, realAbs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, code: 'escape' };
  }
  return { ok: true, realAbs, realRoot };
}

module.exports = {
  diskRoot,
  resolveContainedDiskPath,
  assertRealpathContained
};
