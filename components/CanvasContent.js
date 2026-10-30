'use strict';

const React = require('react');
const { Button, Message } = require('semantic-ui-react');

const HOST_JS = '/bundles/canvas-host.js';

let hostScriptPromise = null;

function loadHostScript () {
  if (!hostScriptPromise) {
    hostScriptPromise = fetch(HOST_JS).then((response) => {
      if (!response.ok) throw new Error('Canvas host failed to load.');
      return response.text();
    }).catch((err) => {
      hostScriptPromise = null;
      throw err;
    });
  }
  return hostScriptPromise;
}

function frameDocument (hostJs) {
  const script = String(hostJs).replace(/<\/script/gi, '<\\/script');
  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; img-src data: blob:; connect-src \'none\';">' +
    '<style>html,body{margin:0;}#root{box-sizing:border-box;padding:16px;}</style>' +
    '</head><body><div id="root"></div><script>' + script + '</script></body></html>';
}

class CanvasContent extends React.Component {
  constructor (props) {
    super(props);
    this.frame = React.createRef();
    this.state = {
      code: null,
      doc: null,
      error: null,
      height: 240,
      showSource: false,
      loading: true
    };
    this.onMessage = this.onMessage.bind(this);
  }

  componentDidMount () {
    window.addEventListener('message', this.onMessage);
    this.load(this.props.source);
  }

  componentDidUpdate (prev) {
    if (prev.source !== this.props.source || prev.canvasState !== this.props.canvasState) {
      this.load(this.props.source);
    }
  }

  componentWillUnmount () {
    window.removeEventListener('message', this.onMessage);
  }

  token () {
    return this.props.token || (this.props.auth && this.props.auth.token) || '';
  }

  load (source) {
    this.setState({ loading: true, error: null, code: null, doc: null, showSource: false });
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const token = this.token();
    if (token) headers.Authorization = 'Bearer ' + token;

    Promise.all([
      fetch('/services/canvas/compile', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ source: source || '' })
      }).then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Canvas compile failed.');
        return body.code;
      }),
      loadHostScript()
    ]).then(([code, hostJs]) => {
      if (this.props.source !== source) return;
      this.setState({ code: code, doc: frameDocument(hostJs), loading: false, error: null });
    }).catch((err) => {
      if (this.props.source !== source) return;
      this.setState({
        loading: false,
        error: err.message || 'Canvas failed to render.',
        showSource: true
      });
    });
  }

  postCode () {
    const frame = this.frame.current;
    if (!frame || !frame.contentWindow || !this.state.code) return;
    frame.contentWindow.postMessage({
      type: 'canvas',
      code: this.state.code,
      state: this.props.canvasState || null
    }, '*');
  }

  onMessage (event) {
    const frame = this.frame.current;
    if (!frame || event.source !== frame.contentWindow) return;
    const data = event.data || {};
    if (data.type === 'canvas-ready') this.postCode();
    if (data.type === 'canvas-height' && Number.isFinite(data.height)) {
      this.setState({ height: Math.max(160, data.height) });
    }
    if (data.type === 'canvas-error') {
      this.setState({ error: data.message || 'Canvas failed to render.', showSource: true });
    }
  }

  render () {
    const { source } = this.props;
    const { doc, error, height, showSource, loading } = this.state;
    return React.createElement('div', { className: 'canvas-document' },
      error ? React.createElement(Message, { negative: true, size: 'small', content: error }) : null,
      loading ? React.createElement('p', null, 'Rendering canvas…') : null,
      doc && !error ? React.createElement('iframe', {
        ref: this.frame,
        title: 'Canvas',
        sandbox: 'allow-scripts',
        srcDoc: doc,
        onLoad: () => this.postCode(),
        style: { width: '100%', height: height, border: '1px solid rgba(127,127,127,0.35)', background: 'transparent' }
      }) : null,
      React.createElement(Button, {
        type: 'button',
        size: 'small',
        basic: true,
        style: { marginTop: '0.75em' },
        onClick: () => this.setState({ showSource: !showSource })
      }, showSource ? 'Hide source' : 'Source'),
      showSource ? React.createElement('pre', {
        style: { overflow: 'auto', marginTop: '0.75em', whiteSpace: 'pre-wrap' }
      }, source || '') : null
    );
  }
}

module.exports = CanvasContent;
