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
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      host: window.location.hostname,
      port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
      secure: window.location.protocol === 'https:',
      debug: false,
      tickrate: 1
    }, props);

    this.state = {
      data: null,
      error: null
    };

    this.attempts = 1;
    this.connections = [];
    this.queue = [];
    this.ws = null;

    return this;
  }

  get authority() {
    return ((this.settings.secure) ? `wss` : `ws`) + `://${this.settings.host}:${this.settings.port}`;
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount() {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
  }

  connect(path) {
    console.debug('[BRIDGE]', 'Opening connection...');
    this.ws = new WebSocket(`${this.authority}${path}`);

    // TODO: re-evaluate multiple connections
    this.connections.push(this.ws);

    this.ws.onopen = () => {
      this.attempts = 1;
      const now = Date.now();
      const message = Message.fromVector(['Ping', now.toString()]);
      this.ws.send(message.toBuffer());
    };

    this.ws.onmessage = async (msg) => {
      // TODO: faster!  converting ArrayBuffer to buffer etc. is slow (~4x)
      if (!msg.data || !msg.data.arrayBuffer) {
        const warning = `Message does not provide an ArrayBuffer:`;
        console.debug('[BRIDGE]', 'No arraybuffer:', warning, msg);
        // this.emit('warning', `${warning} ${msg}`);
        return;
      }

      const array = await msg.data.arrayBuffer();
      const buffer = Buffer.from(array);
      const message = Message.fromBuffer(buffer);

      // TODO: refactor @fabric/core/types/message to support arbitrary message types
      // This will remove the need to parse before evaluating this switch
      switch (message.type) {
        default:
          console.debug('[BRIDGE]', 'Unhandled message type:', message.type);
          break;
        case 'GenericMessage':
          try {
            const chunk = JSON.parse(message.body);

            switch (chunk.type) {
              case 'MessageStart':
                const selector = `[data-message-id="` + chunk.message_id + `"]`;

                setTimeout(() => {
                  const target = document.querySelector(selector);
                }, 250);

                this.addJob('MessageStart', chunk);
                break;
              case 'MessageChunk':
                this.addJob('MessageChunk', chunk);
                break;
              case 'HelpMsgUser':
              case 'HelpMsgAdmin':
                this.props.responseCapture(chunk);
                break;

            }
          } catch (exception) {
            console.error('Could not process message:', exception);
          }

          break;
      }

      try {
        const data = JSON.parse(msg.body);
        this.setState({ data });
      } catch (e) {
        this.setState({ error: e });
      }
    };

    this.ws.onerror = (error) => {
      console.error('[BRIDGE]', 'Error:', error);
      this.setState({ error });
    };

    this.ws.onclose = () => {
      console.debug('[BRIDGE]', 'Connection closed.');
      const time = this.generateInterval(this.attempts);

      setTimeout(() => {
        this.attempts++;
        this.connect(path);
      }, time);
    };
  }

  generateInterval(attempts) {
    return Math.min(30, (Math.pow(2, attempts) - 1)) * 1000;
  }

  addJob(type, data) {
    this.queue.push({ type, data });
  }

  takeJob() {
    if (!this.queue.length) return;
    const job = this.queue.shift();
    if (!job) return;

    switch (job.type) {
      default:
        console.warn('[BRIDGE]', 'Unhandled Bridge job type:', job.type);
        break;
      case 'MessageChunk':
        // console.debug('[BRIDGE]', 'MessageChunk:', job.data);
        break;
      case 'MessageEnd':
        console.debug('[BRIDGE]', 'MessageEnd:', job.data);
        break;
      case 'MessageStart':
        console.debug('[BRIDGE]', 'MessageStart:', job.data);
        break;
    }
  }

  render() {
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

  start() {
    this.connect('/');
    // this.connect('/conversations');
    this._heartbeat = setInterval(this.tick.bind(this), this.settings.tickrate);
  }

  stop() {
    if (this._heartbeat) clearInterval(this._heartbeat);
  }

  tick() {
    this.takeJob();
  }

  subscribe(channel) {
    const message = Message.fromVector(['SUBSCRIBE', channel]);
    this.ws.send(message.toBuffer());
  }

  unsubscribe(channel) {
    const message = Message.fromVector(['UNSUBSCRIBE', channel]);
    this.ws.send(message.toBuffer());
  }
}

module.exports = Bridge;
