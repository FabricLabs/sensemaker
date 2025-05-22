'use strict';

const React = require('react');

class Shoutbox extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      message: ''
    };
  }

  handleChange = (e) => {
    this.setState({ message: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.state.message.trim() && this.props.onSubmit) {
      this.props.onSubmit(this.state.message);
      this.setState({ message: '' });
    }
  };

  render () {
    const messages = this.props.messages || [];
    const recentMessages = messages.slice(-5); // Show only last 5

    return (
      <div className='shoutbox'>
        <div className='messages'>
          {recentMessages.map((msg, index) => (
            <div key={index} className='message'>
              {msg && msg.object && msg.object.content ? msg.object.content : String(msg)}
            </div>
          ))}
        </div>
        <form onSubmit={this.handleSubmit}>
          <input
            type='text'
            value={this.state.message}
            onChange={this.handleChange}
            placeholder='Type your message here...'
          />
          <button type='submit'>Send</button>
        </form>
      </div>
    );
  }
}

module.exports = Shoutbox;
