'use strict';

const React = require('react');

class PaymentRequest extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      debug: false,
      state: {}
    }, props);

    this._state = {
      content: this.settings.state
    };

    return this;
  }

  render () {
    return (
      <div>
        <h1>Payment Request</h1>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = PaymentRequest;
