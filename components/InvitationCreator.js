'use strict';

const React = require('react');

const {
  Button,
  Form,
  Message,
  Segment
} = require('semantic-ui-react');

class InvitationCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      sent: false,
      errorSending: false,
      sending: false
    };
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { email } = this.state;

    if (!email) return;

    this.setState({ sending: true });

    try {
      await this.props.sendInvitation(email);
      this.setState({ 
        sent: true, 
        email: '',
        errorSending: false 
      });
      
      // Reset success message after delay
      setTimeout(() => {
        this.setState({ sent: false });
      }, 3000);
    } catch (error) {
      this.setState({ errorSending: true });
    } finally {
      this.setState({ sending: false });
    }
  };

  render() {
    const { email, sent, errorSending, sending } = this.state;

    return (
      <Segment>
        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>Send New Invitation</label>
            <Form.Input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={email}
              onChange={this.handleInputChange}
              required
            />
          </Form.Field>
          <Button 
            primary 
            type="submit"
            loading={sending}
            disabled={sending}
          >
            Send Invitation
          </Button>
          {sent && (
            <Message positive>
              <Message.Content>
                Invitation sent successfully!
              </Message.Content>
            </Message>
          )}
          {errorSending && (
            <Message negative>
              <Message.Content>
                Failed to send invitation. Please try again.
              </Message.Content>
            </Message>
          )}
        </Form>
      </Segment>
    );
  }
}

module.exports = InvitationCreator;