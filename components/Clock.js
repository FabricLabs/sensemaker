'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Header,
  Segment
} = require('semantic-ui-react');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// TODO: reduce to a web component (no react)
class Clock extends React.Component {
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
  }

  render () {
    const now = new Date();
    return (
      <div compact style={this.style} {...this.props}>
        <Header><code>{now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}</code></Header>
        {this.settings.debug ? (
          <div>
            <pre><code>{JSON.stringify(this.state, null, '  ')}</code></pre>
          </div>
        ) : null}
      </div>
    );
  }

  start () {
    this._state.content.status = 'STARTING';
    this.heart = setInterval(this.tick.bind(this), this.settings.interval);
    this._state.content.status = 'STARTED';
    this.commit();
  }

  stop () {
    this._state.content.status = 'STOPPING';
    clearInterval(this.heart);
    this._state.content.status = 'STOPPED';
    this.commit();
  }

  tick () {
    const parent = this.commit();
    this.setState({
      parent: parent.id,
      content: {
        clock: this.state.content.clock + 1,
        interval: this.settings.interval
      }
    });

    const tick = this.commit();
    return { id: tick.id };
  }
}

module.exports = Clock;
