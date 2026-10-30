'use strict';

const React = require('react');
const { createRoot } = require('react-dom/client');
const canvas = require('../components/canvasRuntime');

const modules = {
  react: React,
  'cursor/canvas': canvas
};

function canvasRequire (id) {
  if (Object.prototype.hasOwnProperty.call(modules, id)) return modules[id];
  throw new Error('Canvas files may only import from cursor/canvas (' + id + ')');
}

class Boundary extends React.Component {
  constructor (props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError (error) {
    return { error: error };
  }

  componentDidCatch (error) {
    const message = error && error.message ? error.message : String(error);
    window.parent.postMessage({ type: 'canvas-error', message: message }, '*');
  }

  render () {
    if (this.state.error) {
      const message = this.state.error.message || String(this.state.error);
      return React.createElement('pre', {
        style: { color: '#f07178', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace' }
      }, message);
    }
    return this.props.children;
  }
}

function reportHeight () {
  const root = document.getElementById('root');
  if (!root) return;
  const height = Math.ceil(Math.max(root.scrollHeight, root.getBoundingClientRect().height));
  window.parent.postMessage({ type: 'canvas-height', height: height }, '*');
}

function paint (theme) {
  document.body.style.background = theme.bg.editor;
  document.body.style.color = theme.text.primary;
  document.body.style.fontFamily = theme.typography.fontFamily;
}

function mount (code, state) {
  const exportsObject = {};
  const module = { exports: exportsObject };
  const run = new Function('exports', 'module', 'require', 'React', code);
  run(exportsObject, module, canvasRequire, React);
  const Component = module.exports.default || exportsObject.default;
  const isComponent = typeof Component === 'function' || (Component && Component.$$typeof);
  if (!isComponent) throw new Error('Canvas has no default export.');

  canvas.setCanvasState(state);
  const theme = canvas.resolveHostTheme();
  paint(theme);

  const rootEl = document.getElementById('root');
  if (!window.__canvasRoot) window.__canvasRoot = createRoot(rootEl);
  window.__canvasRoot.render(
    React.createElement(Boundary, null, React.createElement(Component))
  );
  requestAnimationFrame(reportHeight);
  if (typeof ResizeObserver === 'function' && !window.__canvasResize) {
    window.__canvasResize = new ResizeObserver(reportHeight);
    window.__canvasResize.observe(rootEl);
  }
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'canvas' || typeof data.code !== 'string') return;
  try {
    mount(data.code, data.state);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    window.parent.postMessage({ type: 'canvas-error', message: message }, '*');
  }
});

window.parent.postMessage({ type: 'canvas-ready' }, '*');
