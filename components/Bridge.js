'use strict';

// Dependencies
const React = require('react');
const WebSocket = require('isomorphic-ws');

// Semantic
const {
  Label
} = require('semantic-ui-react');

// Fabric Types
const Message = require('@fabric/core/types/message');

class Bridge extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      host: 'localhost',
      port: 3045,
      secure: false,
      debug: false
    });

    this.state = {
      data: null,
      error: null
    };

    this.attempts = 1;
    this.connections = [];
  }

  get authority () {
    return ((this.settings.secure) ? `wss` : `ws`) + `://${this.settings.host}:${this.settings.port}`;
  }

  componentDidMount () {
    this.connect('/');
    // this.connect('/conversations');
  }

  componentWillUnmount () {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
  }

  connect (path) {
    const ws = new WebSocket(`${this.authority}${path}`);

    this.connections.push(ws);

    ws.onopen = () => {
      this.attempts = 1;

      const now = Date.now();
      const message = Message.fromVector(['Ping', now.toString()]);
      const ping = JSON.stringify(message.toObject());
      if (this.settings.debug) console.debug('ping:', typeof ping, ping);
      ws.send(message.asRaw());
    };

    ws.onmessage = (message) => {
      if (this.settings.debug) console.debug('received ws message:', message);

      try {
        const data = JSON.parse(message);
        this.setState({ data });
      } catch (e) {
        this.setState({ error: e });
      }
    };

    ws.onerror = (error) => {
      this.setState({ error });
    };

    ws.onclose = () => {
      const time = this.generateInterval(this.attempts);

      setTimeout(() => {
        this.attempts++;
        this.connect(path);
      }, time);
    };
  }

  generateInterval (attempts) {
    return Math.min(30, (Math.pow(2, attempts) - 1)) * 1000;
  }

  render () {
    const { data, error } = this.state;

    if (error && this.settings.debug) {
      return <div>Error: {error.message}</div>;
    }

    if (!data && this.settings.debug) {
      return <div>Loading...</div>;
    }

    return (
      <fabric-bridge>
        {this.settings.debug ? (
          <div>
            <h1>Data Received:</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        ) : null}
      </fabric-bridge>
    );
  }
}

module.exports = Bridge;
