'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Header, Segment } = require('semantic-ui-react');

// Fabric
const Message = require('@fabric/core/types/message');
const { computeWebSocketJsonCallHashPair } = require('@fabric/http/functions/fabricJsonRpcTransport');
const { shoutboxDisplay } = require('../functions/shoutbox');

// Components
const SignedMessageBox = require('./SignedMessageBox');
const SignedMessageList = require('./SignedMessageList');

class Global extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      messages: [],
      error: null
    };
  }

  componentDidMount () {
    if (this.props.bridge) {
      this.props.bridge.subscribe('/messages');
      this.props.bridge.onMessage = this.handleBridgeMessage;
    }
  }

  componentWillUnmount () {
    if (this.props.bridge) {
      this.props.bridge.unsubscribe('/messages');
      this.props.bridge.onMessage = null;
    }
  }

  _appendShoutbox = (row) => {
    if (!row || !row.content) return;
    this.setState((prev) => {
      const last = prev.messages[prev.messages.length - 1];
      if (last && last.content === row.content && (Date.now() - (last.created || 0)) < 400) {
        if (!last.actor && row.actor) {
          const messages = prev.messages.slice();
          messages[messages.length - 1] = row;
          return { messages, error: null };
        }
        return prev;
      }
      return { messages: prev.messages.concat([row]), error: null };
    });
  };

  handleBridgeMessage = (msg) => {
    this._appendShoutbox(shoutboxDisplay(msg));
  };

  handleMessageSubmit = (msg) => {
    const text = String(msg || '').trim();
    if (!text) return Promise.resolve();
    if (!this.props.bridge) {
      const error = new Error('Bridge not available');
      this.setState({ error: error.message });
      return Promise.reject(error);
    }

    const body = JSON.stringify({
      method: 'publishShoutbox',
      params: [{ text }]
    });
    const { hash } = computeWebSocketJsonCallHashPair(body);
    const message = Message.fromVector(['JSONCall', body]);

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (this.props.bridge && this.props.bridge.removeResponseCaptureListener) {
          this.props.bridge.removeResponseCaptureListener(onCapture);
        }
        fn(value);
      };

      const onCapture = (payload) => {
        if (!payload || payload.type !== 'GenericMessage' || typeof payload.content !== 'string') return;
        let json = null;
        try {
          json = JSON.parse(payload.content);
        } catch (_) {
          return;
        }
        if (!json || json.method !== 'JSONCallResult' || !json.params || json.params[0] !== hash) return;
        if (json.error) {
          const error = new Error(json.error.message || 'publish failed');
          this.setState({ error: error.message });
          finish(reject, error);
          return;
        }
        const result = json.params[1] || {};
        if (result.content) {
          this._appendShoutbox(shoutboxDisplay({
            type: 'P2P_CHAT_MESSAGE',
            text: result.content,
            created: Date.now()
          }));
        }
        finish(resolve, result);
      };

      const timeout = setTimeout(() => {
        const error = new Error('Timed out publishing shoutbox message');
        this.setState({ error: error.message });
        finish(reject, error);
      }, 8000);

      this.props.bridge.addResponseCaptureListener(onCapture);
      try {
        this.props.bridge.sendSignedMessage(message.toBuffer());
      } catch (err) {
        this.setState({ error: err && err.message ? err.message : 'publish failed' });
        finish(reject, err);
      }
    });
  };

  render () {
    return (
      <Segment>
        <Header as="h1">Global Chat</Header>
        <div>
          <SignedMessageList messages={this.state.messages} />
        </div>
        {this.state.error ? <p>{this.state.error}</p> : null}
        <SignedMessageBox
          onSubmit={this.handleMessageSubmit}
          auth={this.props.auth}
        />
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = Global;
