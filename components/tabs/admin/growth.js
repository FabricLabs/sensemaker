'use strict';

const React = require('react');

const {
  Header, Statistic
} = require('semantic-ui-react');

const AdminInquiries = require('../../AdminSettingsInquiries');
const AdminInvitations = require('../../AdminSettingsInvitations');

class AdminGrowthTab extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'JEEVES',
        name: 'jeeves',
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
    const {inquiries, invitation, stats} = this.props;

    const inquiriesTotal = stats?.inquiries?.total ?? 0;
    const invitationsTotal = stats?.invitations?.total ?? 0;
    const usersTotal = stats?.users?.total ?? 0;

    return ( 
      <adminGrowthTab>
        <Header as='h4'>Metrics</Header>
        <Statistic>
          <Statistic.Value>{inquiriesTotal}</Statistic.Value>
          <Statistic.Label>Waiting</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{invitationsTotal}</Statistic.Value>
          <Statistic.Label>Sent</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{usersTotal}</Statistic.Value>
          <Statistic.Label>Users</Statistic.Label>
        </Statistic>
        <AdminInquiries
          inquiries={inquiries}
          fetchInquiries={this.props.fetchInquiries}
          fetchInvitations={this.props.fetchInvitations}
          sendInvitation={this.props.sendInvitation}
          invitation={invitation}
          deleteInquiry={this.props.deleteInquiry}
        />
        <AdminInvitations
          invitation={invitation}
          fetchInvitations={this.props.fetchInvitations}
          sendInvitation={this.props.sendInvitation}
          reSendInvitation={this.props.reSendInvitation}
          deleteInvitation={this.props.deleteInvitation}
        />
      </adminGrowthTab>
    )
  }
}

module.exports = AdminGrowthTab;