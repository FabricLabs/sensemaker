'use strict';

/** Largest canvas source the compiler will accept. */
const MAX_CANVAS_SOURCE = 1024 * 1024;

/**
 * Turn a Cursor canvas (`.canvas.tsx`) into CommonJS the sandbox can run.
 * Does not execute the component. Unknown imports fail later, inside the
 * frame, whose `require` only resolves `react` and `cursor/canvas`.
 * @param {string} source
 * @returns {{ ok: true, code: string }|{ ok: false, error: string }}
 */
function compileCanvas (source) {
  if (typeof source !== 'string') {
    return { ok: false, error: 'Canvas source must be text.' };
  }
  if (source.length > MAX_CANVAS_SOURCE) {
    return { ok: false, error: 'Canvas source is too large.' };
  }

  let babel;
  let presetTypescript;
  let presetReact;
  let presetEnv;
  try {
    babel = require('@babel/core');
    presetTypescript = require('@babel/preset-typescript');
    presetReact = require('@babel/preset-react');
    presetEnv = require('@babel/preset-env');
  } catch (err) {
    return { ok: false, error: 'Canvas compiler is not installed.' };
  }

  try {
    // Presets run last to first: strip types, then JSX, then CommonJS.
    const result = babel.transformSync(source, {
      filename: 'canvas.tsx',
      babelrc: false,
      configFile: false,
      ast: false,
      sourceMaps: false,
      presets: [
        [presetEnv, { modules: 'commonjs', targets: { esmodules: true } }],
        [presetReact, { runtime: 'classic' }],
        [presetTypescript, { allExtensions: true, isTSX: true, onlyRemoveTypeImports: true }]
      ]
    });
    if (!result || typeof result.code !== 'string' || !result.code) {
      return { ok: false, error: 'Canvas compile produced no code.' };
    }
    return { ok: true, code: result.code };
  } catch (err) {
    const message = err && err.message ? String(err.message) : 'Canvas compile failed.';
    return { ok: false, error: message.split('\n')[0] };
  }
}

module.exports = {
  MAX_CANVAS_SOURCE,
  compileCanvas
};
