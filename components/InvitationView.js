'use strict';

const React = require('react');

const {
  Button,
  Card,
  Grid,
  Segment
} = require('semantic-ui-react');

const SignUpForm = require('./SignUpForm');

class InvitationView extends React.Component {
  constructor (props) {
    super(props);
    this.handleAccept = this.handleAccept.bind(this);
    this.handleReject = this.handleReject.bind(this);
    this.state = {
      showSignupForm: false
    };
  }

  componentDidMount () {
    console.debug('InvitationView mounted, fetching invitation details...');
    this.props.fetchResource();
  }

  handleAccept () {
    const invitation = this.props.api?.resource;
    console.debug('Accepting invitation:', invitation);
    this.setState({ showSignupForm: true });
  }

  handleReject () {
    const invitation = this.props.api?.resource;
    console.debug('Rejecting invitation:', invitation);
    if (invitation && invitation.token) {
      this.props.declineInvitation(invitation.token)
        .catch((error) => {
          console.error('Failed to decline invitation:', error);
          // Error handling will be done through the api.error prop update
        });
    }
  }

  render () {
    const { name } = this.props;
    const { error, loading } = this.props.api || {};
    const invitation = this.props.api?.resource;
    console.debug('Render - props:', this.props);
    console.debug('Render - invitation:', invitation);

    const containerStyle = {
    };

    const buttonStyle = {
    };

    const acceptButtonStyle = {
      ...buttonStyle,
    };

    const rejectButtonStyle = {
      ...buttonStyle,
    };

    const status = invitation?.status;
    const isInvalidInvitation = error || (!loading && (!invitation || status === 'accepted' || status === 'rejected'));

    return (
      <sensemaker-invitation style={containerStyle} class='fade-in'>
        <style>
          {`
            html, body {
              background-color: #1b1c1d;
            }

            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .signup-form-animate {
              animation: fadeIn 0.3s ease-out, slideDown 0.4s ease-out;
            }

            .content-height-transition {
              transition: max-height 0.4s ease-out;
              max-height: 80px; /* Height for button group */
              overflow: hidden;
            }

            .content-height-transition.expanded {
              max-height: 600px; /* Max height for signup form - adjust if needed */
            }

            .status-message {
              text-align: center;
              padding: 2em;
            }

            .error-message {
              color: #db2828;
              padding: 2em;
            }
          `}
        </style>
        <fabric-component class="ui primary action fluid container">
          <Grid centered width="100%" style={{ padding: '1em' }}>
            <Grid.Column mobile={16} tablet={8} computer={8}>
              <Card fluid>
                {isInvalidInvitation ? (
                  <Card.Content>
                    <div className="error-message">
                      <h2>Invalid invitation.</h2>
                    </div>
                  </Card.Content>
                ) : loading ? (
                  <Card.Content>
                    <div className="status-message">
                      <h2>Loading...</h2>
                      <p>Please wait while we fetch the invitation details.</p>
                    </div>
                  </Card.Content>
                ) : (
                  <>
                    <Card.Content>
                      <Card.Header as="h2" style={{ marginBottom: 0 }}>An Invitation To</Card.Header>
                      <h1 style={{ marginTop: 0 }}>Join {name || 'SENSEMAKER'}</h1>
                      {status === 'pending' && invitation && (
                        <div style={{ marginBottom: '20px' }}>
                          <h3>From: {invitation.sender_username || 'Someone'}</h3>
                          <p>{invitation.message || `You have been invited to create an account on ${name || 'SENSEMAKER'}, an AI node they manage.`}</p>

                          {invitation.groupName && (
                            <p>Group: <strong>{invitation.groupName}</strong></p>
                          )}

                          {invitation.expiration && (
                            <p>Valid until: {new Date(invitation.expiration).toLocaleDateString()}</p>
                          )}
                        </div>
                      )}
                    </Card.Content>
                    <Card.Content extra>
                      <div className={`content-height-transition ${this.state.showSignupForm ? 'expanded' : ''}`}>
                        {this.state.showSignupForm ? (
                          <div className="signup-form-animate">
                            <SignUpForm
                              {...this.props}
                              invitationToken={invitation.token}
                              checkInvitationToken={this.props.checkInvitationToken}
                              checkUsernameAvailable={this.props.checkUsernameAvailable}
                              checkEmailAvailable={this.props.checkEmailAvailable}
                              auth={this.props.auth}
                              invitation={this.props.invitation}
                              fullRegister={this.props.fullRegister}
                              acceptInvitation={this.props.acceptInvitation}
                            />
                          </div>
                        ) : (
                          <Button.Group widths={2} style={{ marginTop: '30px' }}>
                            <Button
                              color='red'
                              style={rejectButtonStyle}
                              onClick={this.handleReject}
                              disabled={status === 'rejecting'}>
                              {status === 'rejecting' ? 'Declining...' : 'Decline'}
                            </Button>
                            <Button
                              color='green'
                              style={acceptButtonStyle}
                              onClick={this.handleAccept}
                              disabled={status === 'accepting'}>
                              {status === 'accepting' ? 'Accepting...' : 'Accept'}
                            </Button>
                          </Button.Group>
                        )}
                      </div>
                    </Card.Content>
                  </>
                )}
              </Card>
            </Grid.Column>
          </Grid>
        </fabric-component>
      </sensemaker-invitation>
    );
  }
}

module.exports = InvitationView;
