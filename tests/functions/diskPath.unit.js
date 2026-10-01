'use strict';

const assert = require('assert');
const path = require('path');
const { resolveContainedDiskPath } = require('../../functions/diskPath');

describe('resolveContainedDiskPath', function () {
  it('keeps relative names under the disk root', function () {
    const resolved = resolveContainedDiskPath('package.json');
    assert.strictEqual(resolved.ok, true);
    assert.strictEqual(resolved.rel, 'package.json');
    assert.ok(resolved.abs.startsWith(resolved.root));
  });

  it('rejects parent-directory escapes', function () {
    const resolved = resolveContainedDiskPath('../etc/passwd');
    assert.strictEqual(resolved.ok, false);
    assert.strictEqual(resolved.code, 'escape');
  });

  it('rejects NUL bytes', function () {
    const resolved = resolveContainedDiskPath('foo\0bar');
    assert.strictEqual(resolved.ok, false);
    assert.strictEqual(resolved.code, 'invalid');
  });

  it('treats empty as the root', function () {
    const resolved = resolveContainedDiskPath('');
    assert.strictEqual(resolved.ok, true);
    assert.strictEqual(resolved.abs, resolved.root);
    assert.strictEqual(resolved.rel, '');
  });

  it('does not treat nested names as escapes', function () {
    const resolved = resolveContainedDiskPath(path.join('functions', 'diskPath.js'));
    assert.strictEqual(resolved.ok, true);
  });
});
