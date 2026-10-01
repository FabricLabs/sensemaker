'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Container, Header, Icon, Segment, Form, Input } = require('semantic-ui-react');

// Fabric
const Message = require('@fabric/core/types/message');

// Components
const SignedMessageBox = require('./SignedMessageBox');
const SignedMessageList = require('./SignedMessageList');

class Global extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      showKeyringManager: false
    };
  }

  componentDidMount () {
    // Subscribe to global chat channel
    if (this.props.bridge) {
      this.props.bridge.subscribe('/messages');
      // Listen for incoming messages
      this.props.bridge.onMessage = this.handleBridgeMessage;
    }
  }

  componentWillUnmount () {
    // Unsubscribe from global chat channel
    if (this.props.bridge) {
      this.props.bridge.unsubscribe('/messages');
      // Remove message listener
      this.props.bridge.onMessage = null;
    }
  }

  handleBridgeMessage = (msg) => {
    // Mesh shoutbox: P2P_CHAT_MESSAGE (canonical) or legacy ChatMessage.
    const t = msg && msg.type;
    const isChat = t === 'P2P_CHAT_MESSAGE' || t === 'ChatMessage' || t === 'CHAT_MESSAGE';
    if (!isChat || !msg.object) return;
    if (msg.target && msg.target !== '/messages') return;
    this.setState(prevState => ({
      messages: [...prevState.messages, msg]
    }));
  };

  handleMessageSubmit = async (msg) => {
    try {
      const body = {
        type: 'P2P_CHAT_MESSAGE',
        actor: {
          id: this.props.auth && this.props.auth.id
        },
        object: {
          created: Date.now(),
          content: msg
        },
        target: '/messages'
      };

      // Canonical mesh outer type — same OUTER.P2P_CHAT_MESSAGE as
      // contracts/applicationMessageTypes (Hub / Core Peer / Sensemaker).
      const message = Message.fromVector(['P2P_CHAT_MESSAGE', JSON.stringify(body)]);
      console.debug('[FABRIC:GLOBAL]', 'Message:', message);

      if (this.props.bridge) {
        console.debug('[FABRIC:GLOBAL]', 'Sending message to bridge:', message);
        this.props.bridge.sendSignedMessage(message.toBuffer());
      }

      this.setState(prevState => ({
        messages: [...prevState.messages, body]
      }));
    } catch (error) {
      console.error('[FABRIC:GLOBAL]', 'Failed to submit message:', error);
    }
  };

  render () {
    return (
      <Segment>
        <Header as="h1">Global Chat</Header>
        <div>
          <SignedMessageList messages={this.state.messages} />
        </div>
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
