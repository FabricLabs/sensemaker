'use strict';

// Dependencies
const React = require('react');
const {
  useParams
} = require('react-router-dom');

// Semantic UI
const {
  Link,
  Form,
  Button,
  Message,
  Header,
  Segment,
} = require('semantic-ui-react');

class DeclinedInvitation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      errorContent: '',
      tokenError: false,
      declined: false,
      cancelled: false,
    };
  }

  componentDidMount = async () => {

    //NOTE: I DON'T LIKE THIS TITLE SETTING
    document.title = "Novo · Your Legal Assistant";

    const { invitationToken } = this.props;
    this.setState({ loading: true });
    try {
      await this.props.checkInvitationToken(invitationToken);
    } catch (error) {
      this.setState({ loading: false, tokenError: true, errorContent: 'Internal server error, please try again later.' });
    }
  };


  componentDidUpdate(prevProps) {
    if (prevProps.invitation !== this.props.invitation) {
      const { invitation } = this.props;
      if (invitation.invitationValid) {
        this.setState({ loading: false, tokenError: false, errorContent: '' });
      } else {
        this.setState({ loading: false, tokenError: true, errorContent: invitation.error });
      }
    }
  };

  declineInvitation = async () => {
    try {
      await this.props.declineInvitation(this.props.invitationToken);
      this.setState({ declined: true });
    } catch (error) {
      console.log(error);
    }
  }

  handleCancel = () => {
    this.setState({ cancelled: true });
  };

  render() {
    const { tokenError, errorContent, declined, cancelled, loading } = this.state;
    return (
      <Segment className='fade-in' style={{ maxWidth: '500px' }} loading={loading}>
        {(tokenError) && (
          <Message negative>
            <Message.Header style={{ marginBottom: '1rem' }}>Something went wrong.</Message.Header>
            <p>{errorContent}</p>
          </Message>
        )}
        {(!tokenError && !declined && !cancelled) && (
          <Message>
            <Message.Header style={{ marginBottom: '1rem' }}>Are you sure you want to decline?</Message.Header>
            <p>
              Please confirm your decision to decline the invitation.
              By proceeding, you will not receive further communications regarding this invitation.
              We respect your choice and thank you for your consideration.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <Button primary onClick={this.handleCancel}>Cancel</Button>
              <Button grey onClick={this.declineInvitation}>Decline</Button>
            </div>
          </Message>
        )}
        {(!tokenError && declined) && (
          <Message negative>
            <Message.Header style={{ marginBottom: '1rem' }}>Invitation Declined</Message.Header>
            <p>You have declined your invitation to Novo. If you change your mind you can sign up at trynovo.com. If you have any questions please contact <a href="mailto:support@trynovo.com">support@trynovo.com</a>.</p>
          </Message>
        )}
        {(!tokenError && cancelled) && (
          <Message positive>
            <Message.Header style={{ marginBottom: '1rem' }}>Congratulations!</Message.Header>
            <p>Your invitation remains active and can be used to register at any time. For assistance, contact us at <a href="mailto:support@trynovo.com">support@trynovo.com</a>.</p>
          </Message>
        )}
      </Segment>
    );
  }
}

function DeclineInvite(props) {
  const { invitationToken } = useParams();
  return <DeclinedInvitation invitationToken={invitationToken} {...props} />;
}
module.exports = DeclineInvite;
