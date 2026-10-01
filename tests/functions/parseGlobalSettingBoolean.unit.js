'use strict';

const assert = require('assert');
const parseGlobalSettingBoolean = require('../../functions/parseGlobalSettingBoolean');

describe('parseGlobalSettingBoolean', function () {
  it('returns the default when value is nullish', function () {
    assert.strictEqual(parseGlobalSettingBoolean(null, true), true);
    assert.strictEqual(parseGlobalSettingBoolean(undefined, false), false);
  });

  it('parses booleans, numbers, and strings', function () {
    assert.strictEqual(parseGlobalSettingBoolean(true, false), true);
    assert.strictEqual(parseGlobalSettingBoolean(1, false), true);
    assert.strictEqual(parseGlobalSettingBoolean('true', false), true);
    assert.strictEqual(parseGlobalSettingBoolean('false', true), false);
    assert.strictEqual(parseGlobalSettingBoolean(JSON.stringify(false), true), false);
  });
});
