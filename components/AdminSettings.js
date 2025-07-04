'use strict';

// Dependencies
const React = require('react');
const marked = require('marked');

// Components
const withNavigate = require('../components/Navigate');
const AdminUsers = require('./AdminSettingsUsers');
const AdminInquiries = require('./AdminSettingsInquiries');
const AdminInvitations = require('./AdminSettingsInvitations');
const AdminConversationsTab = require('./tabs/admin/conversations');
const AdminMemoriesTab = require('./tabs/admin/memories');
const AdminServicesTab = require('./tabs/admin/services');
const AdminSettingsTab = require('./tabs/admin/settings');
const AdminAgentsTab = require('./tabs/admin/agents');
const AnnouncementCreator = require('./AnnouncementCreator');
const AnnouncementList = require('./AnnouncementList');
const InvitationCreator = require('./InvitationCreator');
const InvoiceCreator = require('./InvoiceCreator');

// Semantic UI
const {
  Header,
  Message,
  Segment,
  Menu,
  Statistic,
  Button,
  Modal
} = require('semantic-ui-react');

class AdminSettings extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'SENSEMAKER',
        name: 'sensemaker',
        statistics: {
          counts: {
            waitlist: 0,
            pending: 0,
            users: 0,
            conversations: 0,
            messages: 0,
            documents: 0
          }
        },
        announcements: [],
        waitlistSignupCount: 0,
        currentPage: 1,
        windowWidth: window.innerWidth,
        activeTab: this.getInitialTab(),
        announcementModalOpen: false,
        invitationModalOpen: false
      }
    }, props);

    this.state = this.settings.state;
  }

  getInitialTab () {
    const hash = window.location.hash.replace('#', '');
    return hash || 'overview';
  }

  componentDidMount () {
    this.props.fetchAdminStats();
    this.props.fetchAnnouncements();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('hashchange', this.handleHashChange);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  handleHashChange = () => {
    this.setState({ activeTab: this.getInitialTab() });
  };

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  };

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  handleTabClick = (e, { name }) => {
    window.location.hash = name;
    this.setState({ activeTab: name });
  };

  handleAnnouncementModalOpen = () => {
    this.setState({ announcementModalOpen: true });
  }

  handleAnnouncementModalClose = () => {
    this.setState({ announcementModalOpen: false });
  }

  handleInvitationModalOpen = () => {
    this.setState({ invitationModalOpen: true });
  }

  handleInvitationModalClose = () => {
    this.setState({ invitationModalOpen: false });
  }

  renderOverviewTab () {
    const { stats, announcements, editAnnouncement } = this.props;
    const inquiriesWaiting = stats?.inquiries?.waiting ?? 0;
    const invitationsTotal = stats?.invitations?.total ?? 0;
    const usersTotal = stats?.users?.total ?? 0;

    return (
      <div>
        <Header as='h4'>Metrics</Header>
        <Statistic.Group>
          <Statistic>
            <Statistic.Value>{usersTotal}</Statistic.Value>
            <Statistic.Label>Users</Statistic.Label>
          </Statistic>
          <Statistic>
            <Statistic.Value>{inquiriesWaiting}</Statistic.Value>
            <Statistic.Label>Waiting</Statistic.Label>
          </Statistic>
          <Statistic>
            <Statistic.Value>{invitationsTotal}</Statistic.Value>
            <Statistic.Label>Invited</Statistic.Label>
          </Statistic>
        </Statistic.Group>
        <sensemaker-announcements>
          <Header as='h4' style={{ marginTop: '2em' }}>Announcements</Header>
          <p>Announcements are displayed to all users of this node.</p>
          <AnnouncementList
            {...this.props}
            announcements={announcements?.announcements}
            isAdmin={true}
            editAnnouncement={editAnnouncement}
          />
          <Button primary onClick={this.handleAnnouncementModalOpen}>
            Create Announcement
          </Button>
          <Modal
            open={this.state.announcementModalOpen}
            onClose={this.handleAnnouncementModalClose}
            size="large"
          >
            <Modal.Header>Create Announcement</Modal.Header>
            <Modal.Content>
              <AnnouncementCreator onClose={this.handleAnnouncementModalClose} />
            </Modal.Content>
          </Modal>
        </sensemaker-announcements>
        <Header as='h4' style={{ marginTop: '2em' }}>Send Invitation</Header>
        <p>Send an invitation to a new user.</p>
        <Button primary onClick={this.handleInvitationModalOpen}>
          Create Invitation
        </Button>
        <div style={{ marginTop: '1em', marginLeft: '1em' }}>
          <InvoiceCreator bridge={this.props.bridge} />
        </div>
        <Modal
          open={this.state.invitationModalOpen}
          onClose={this.handleInvitationModalClose}
          size="small"
        >
          <Modal.Header>Send Invitation</Modal.Header>
          <Modal.Content>
            <InvitationCreator
              sendInvitation={this.props.sendInvitation}
              onClose={this.handleInvitationModalClose}
            />
          </Modal.Content>
        </Modal>
      </div>
    );
  }

  renderUsersTab () {
    return (
      <div>
        <AdminUsers {...this.props} />
        <AdminInquiries
          inquiries={this.props.inquiries}
          fetchInquiries={this.props.fetchInquiries}
          fetchInvitations={this.props.fetchInvitations}
          sendInvitation={this.props.sendInvitation}
          invitation={this.props.invitation}
          deleteInquiry={this.props.deleteInquiry}
        />
        <AdminInvitations
          invitation={this.props.invitation}
          fetchInvitations={this.props.fetchInvitations}
          sendInvitation={this.props.sendInvitation}
          reSendInvitation={this.props.reSendInvitation}
          deleteInvitation={this.props.deleteInvitation}
        />
      </div>
    );
  }

  render () {
    return (
      <sensemaker-admin-settings class='fade-in' style={{ height: '100%' }}>
        <Segment fluid style={{ height: '100%', overflowX: 'hidden'}}>
          <Header as='h2'>Admin</Header>
          <p><strong>Debug:</strong> <code>{this.settings.debug}</code></p>
          <Menu pointing secondary>
            <Menu.Item
              name='overview'
              active={this.state.activeTab === 'overview'}
              onClick={this.handleTabClick}
            />
            <Menu.Item
              name='users'
              active={this.state.activeTab === 'users'}
              onClick={this.handleTabClick}
            />
            <Menu.Item
              name='conversations'
              active={this.state.activeTab === 'conversations'}
              onClick={this.handleTabClick}
            />
            <Menu.Item
              name='memories'
              active={this.state.activeTab === 'memories'}
              onClick={this.handleTabClick}
            />
            <Menu.Item
              name='services'
              active={this.state.activeTab === 'services'}
              onClick={this.handleTabClick}
            />
            <Menu.Item
              name='settings'
              active={this.state.activeTab === 'settings'}
              onClick={this.handleTabClick}
            />
            <Menu.Item
              name='agents'
              active={this.state.activeTab === 'agents'}
              onClick={this.handleTabClick}
            />
          </Menu>
          {this.state.activeTab === 'overview' && this.renderOverviewTab()}
          {this.state.activeTab === 'users' && this.renderUsersTab()}
          {this.state.activeTab === 'conversations' && <AdminConversationsTab {...this.props} />}
          {this.state.activeTab === 'memories' && <AdminMemoriesTab {...this.props} />}
          {this.state.activeTab === 'services' && <AdminServicesTab {...this.props} />}
          {this.state.activeTab === 'settings' && <AdminSettingsTab {...this.props} />}
          {this.state.activeTab === 'agents' && <AdminAgentsTab {...this.props} />}
        </Segment>
      </sensemaker-admin-settings>
    );
  }
}

module.exports = withNavigate(AdminSettings);
