'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Divider,
  Form,
  Header,
  Icon,
  Input,
  Label,
  Segment,
  Table
} = require('semantic-ui-react');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Local Components
const ChatBox = require('./ChatBox');

// TODO: reduce to a web component (no react)
class SourceView extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.creation = new Date();
    this.settings = Object.assign({
      clock: 0,
      debug: false,
      interval: 1000
    }, props);

    // State
    this.heart = null;
    this.style = this.props.style || {};
    this.state = {
      content: {
        clock: this.settings.clock,
        interval: this.settings.interval
      }
    };

    // Fabric State
    this._state = {
      content: JSON.parse(JSON.stringify(this.state))
    };

    return this;
  }

  // TODO: reconcile with Fabric API
  commit () {
    return new Actor({
      content: this._state.content
    });
  }

  componentDidMount () {
    this.start();
    this.props.fetchResource();
  }

  render () {
    const now = new Date();
    const { network, peers, sources } = this.props;
    return (
      <Segment className='fade-in' loading={sources?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <h2>{this.props.api.resource.name}</h2>
        <p>{this.props.api.resource.content}</p>
        <p>{this.props.api.resource.description}</p>
        <ChatBox {...this.props} context={{ source: this.props.api?.resource }} placeholder='Ask about this source...' />
      </Segment>
    );
  }

  start () {
    this._state.content.status = 'STARTING';
    // this.heart = setInterval(this.tick.bind(this), this.settings.interval);
    this._state.content.status = 'STARTED';
    this.commit();
  }

  stop () {
    this._state.content.status = 'STOPPING';
    clearInterval(this.heart);
    this._state.content.status = 'STOPPED';
    this.commit();
  }
}

module.exports = SourceView;
