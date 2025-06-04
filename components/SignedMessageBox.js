'use strict';

const React = require('react');
const { Form, Input } = require('semantic-ui-react');

class SignedMessageBox extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      message: '',
      loading: false,
      signingKey: null
    };
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const { message } = this.state;
    const { onSubmit } = this.props;

    if (!message.trim()) return;

    this.setState({ loading: true });

    try {
      await onSubmit(message);
      // Clear the input after successful submission
      this.setState({ message: '', loading: false });
    } catch (error) {
      console.error('Failed to send message:', error);
      this.setState({ loading: false });
    }
  };

  handleChange = (event) => {
    this.setState({ message: event.target.value });
  };

  render () {
    return (
      <Form onSubmit={this.handleSubmit} loading={this.state.loading}>
        <Input
          fluid
          action={{
            color: 'blue',
            icon: 'send',
            loading: this.state.loading,
            disabled: !this.state.message.trim()
          }}
          placeholder="Type your message..."
          value={this.state.message}
          onChange={this.handleChange}
        />
      </Form>
    );
  }
}

module.exports = SignedMessageBox; 