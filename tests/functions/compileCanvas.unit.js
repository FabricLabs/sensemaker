'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const canvas = require('../../components/canvasRuntime');
const { compileCanvas, MAX_CANVAS_SOURCE } = require('../../functions/compileCanvas');

const FIXTURE = [
  'import { H1, Stack } from "cursor/canvas";',
  'import type { CSSProperties } from "cursor/canvas";',
  '',
  'type Title = string;',
  'const title: Title = "Canvas fixture";',
  '',
  'export default function Fixture(): CSSProperties {',
  '  return (',
  '    <Stack gap={8}>',
  '      <H1>{title}</H1>',
  '    </Stack>',
  '  );',
  '}',
  ''
].join('\n');

function runCompiled (code, canvasRequire) {
  const sandbox = {
    code: code,
    exports: {},
    module: { exports: {} },
    require: canvasRequire,
    React: {
      createElement: function (type, props) {
        const children = Array.prototype.slice.call(arguments, 2);
        return { type: type, props: props, children: children };
      }
    }
  };
  sandbox.module.exports = sandbox.exports;
  vm.createContext(sandbox);
  vm.runInContext(
    'new Function("exports", "module", "require", "React", code)(exports, module, require, React);',
    sandbox
  );
  return sandbox.module.exports.default || sandbox.exports.default;
}

describe('compileCanvas', function () {
  it('compiles a typed canvas to a component', function () {
    const result = compileCanvas(FIXTURE);
    assert.strictEqual(result.ok, true, result.error);
    const cursorCanvas = { Stack: 'Stack', H1: 'H1' };
    const Component = runCompiled(result.code, function (id) {
      if (id === 'cursor/canvas') return cursorCanvas;
      throw new Error('denied ' + id);
    });
    assert.strictEqual(typeof Component, 'function');
    const element = Component();
    assert.strictEqual(element.type, 'Stack');
    assert.strictEqual(element.children[0].type, 'H1');
    assert.strictEqual(element.children[0].children[0], 'Canvas fixture');
  });

  it('refuses an import other than cursor/canvas when the module runs', function () {
    const result = compileCanvas('import fs from "fs";\nexport default function C() { return null; }\n');
    assert.strictEqual(result.ok, true, result.error);
    assert.throws(() => {
      runCompiled(result.code, function (id) {
        if (id === 'cursor/canvas') return {};
        throw new Error('Canvas files may only import from cursor/canvas (' + id + ')');
      });
    }, /cursor\/canvas/);
  });

  it('renders the directory fixture with seeded canvas state', function () {
    const source = fs.readFileSync(path.join(__dirname, '../fixtures/sample.canvas.tsx'), 'utf8');
    const result = compileCanvas(source);
    assert.strictEqual(result.ok, true, result.error);
    canvas.setCanvasState(JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/sample.canvas.data.json'), 'utf8')));
    const exportsObject = {};
    const module = { exports: exportsObject };
    const run = new Function('exports', 'module', 'require', 'React', result.code);
    run(exportsObject, module, function (id) {
      if (id === 'cursor/canvas') return canvas;
      if (id === 'react') return React;
      throw new Error('denied ' + id);
    }, React);
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(module.exports.default));
    assert.ok(html.includes('Canvas fixture'));
    assert.ok(html.includes('Rendered from a directory.'));
    assert.ok(html.includes('from the directory'));
  });

  it('returns a compile error instead of throwing', function () {
    const result = compileCanvas('export default function Broken( {\n  return <h1>;\n}\n');
    assert.strictEqual(result.ok, false);
    assert.ok(result.error);
    const huge = compileCanvas('x'.repeat(MAX_CANVAS_SOURCE + 1));
    assert.strictEqual(huge.ok, false);
  });
});
