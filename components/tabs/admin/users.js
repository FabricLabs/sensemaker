'use strict';

const React = require('react');
const AdminUsers = require('../../AdminSettingsUsers');
const SignUpForm = require('../../SignUpForm');

const {
  Header
} = require('semantic-ui-react');

class AdminUsersTab extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'SENSEMAKER',
        name: 'sensemaker',
        statistics: {
          counts: {
            waitlist: 0,
            pending: 0, // pending invitations
            users: 0,
            conversations: 0,
            messages: 0,
            courts: 0,
            cases: 0,
            documents: 0
          }
        },
        waitlistSignupCount: 0,
        currentPage: 1,
        windowWidth: window.innerWidth
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount() {
    this.props.fetchAdminStats();
    //this is not doing anything yet
    //this.props.fetchAllConversationsFromAPI();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  };

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  render () {
    return (
      <adminUsersTab>
          <AdminUsers {...this.props} />
          <section style={{ width: '100%', marginTop:'1em' }} className='col-center'>
            <Header as='h3'>Create User</Header>
            <SignUpForm
              adminPanel={true}
              checkInvitationToken={this.props.checkInvitationToken}
              checkUsernameAvailable={this.props.checkUsernameAvailable}
              checkEmailAvailable={this.props.checkEmailAvailable}
              auth={this.props.auth}
              invitation={this.props.invitation}
              fullRegister={this.props.fullRegister}
            ></SignUpForm>
          </section>
      </adminUsersTab>
    )
  }
}

module.exports = AdminUsersTab;
