'use strict';

const assert = require('assert');

const tokenize = require('../../functions/tokenize');

describe('functions/tokenize.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof tokenize, 'function');
  });

  it('splits a simple sentence on whitespace', function () {
    assert.deepStrictEqual(tokenize('hello world'), ['hello', 'world']);
  });

  it('handles tabs and newlines as separators', function () {
    assert.deepStrictEqual(tokenize('a\tb\nc d'), ['a', 'b', 'c', 'd']);
  });

  it('returns a single-element array for an unsplittable input', function () {
    assert.deepStrictEqual(tokenize('one'), ['one']);
  });

  it('returns an array of empty strings for empty input', function () {
    assert.deepStrictEqual(tokenize(''), ['']);
  });
});
