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
  Label
} = require('semantic-ui-react');

class DeclinedInvitation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      errorContent: '',
      tokenError: false,
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
        this.props.declineInvitation(this.props.invitationToken);
      } else {
        this.setState({ loading: false, tokenError: true, errorContent: invitation.error });
      }
    }
  };

  render() {
    return (
      <Segment className='fade-in' style={{ maxWidth: '500px' }} loading={this.state.loading}>
        {(!this.state.tokenError) && (
          <Message negative>
            <Message.Header style={{ marginBottom: '1rem' }}>Invitation Declined</Message.Header>
            <p>We have registered that you declined our invitation. We will not send any further requests or communications.</p>
            <p>Should you change your mind or have any questions in the future, please feel free to contact us.</p>
          </Message>
        )}
        {(this.state.tokenError) && (
          <Message negative>
            <Message.Header style={{ marginBottom: '1rem' }}>Something went wrong.</Message.Header>
            <p>{this.state.errorContent}</p>
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
