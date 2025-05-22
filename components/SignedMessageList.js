'use strict';

const React = require('react');

class SignedMessageList extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      message: '',
      loading: false,
      signingKey: null
    };
  }

  handleChange = (event) => {
    this.setState({ messages: event.target.value });
  };

  render () {
    return (
      <div>
        {this.props.messages.map((message, index) => (
          <div key={index}>
            <div>{message.content}</div>
          </div>
        ))}
      </div>
    );
  }
}

module.exports = SignedMessageList; 