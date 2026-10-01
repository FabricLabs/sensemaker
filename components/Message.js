'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');

/**
 * Message component for displaying a message.
 */
class Message extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      state: {
        message: 'Hello, Sensemaker!'
      }
    }, props);

    // React State
    this._state = {
      content: this.settings.state
    };

    return this;
  }

  render () {
    return (
      <div className="message">
        <p>{this.state.message}</p>
      </div>
    );
  }

  html () {
    return ReactDOMServer.renderToStaticMarkup(this);
  }
}

module.exports = Message;
