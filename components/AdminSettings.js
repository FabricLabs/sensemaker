'use strict';

// Dependencies
const React = require('react');

// Components
const withNavigate = require('../components/Navigate');

// Semantic UI
const {
  Header,
  Segment,
  Tab,
} = require('semantic-ui-react');

// Components
const AnnouncementCreator = require('./AnnouncementCreator');
const AdminOverviewTab = require('./tabs/admin/overview');
const AdminSettingsTab = require('./tabs/admin/settings');
const AdminUsersTab = require ('./tabs/admin/users');
const AdminGrowthTab = require('./tabs/admin/growth');
const AdminDesign = require ('./tabs/admin/design');
const AdminConversationsTab = require('./tabs/admin/conversations');
const AdminServicesTab = require('./tabs/admin/services');

// TODO: add history push to different tabs
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
            pending: 0, // pending invitations
            users: 0,
            conversations: 0,
            messages: 0,
            documents: 0
          }
        },
        waitlistSignupCount: 0,
        currentPage: 1,
        activeIndex: 0,
        windowWidth: window.innerWidth,
        currentPane:'',
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount () {
    this.props.fetchAdminStats();
    const path = this.props.location.pathname;
    this.setState({activeIndex: this.props.activeIndex})
    //this is not doing anything yet
    //this.props.fetchAllConversationsFromAPI();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  };

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };
  
  componentDidUpdate (prevProps) {
    const {activeIndex} = this.props
    if (prevProps.activeIndex !== activeIndex ) {
      this.setState({activeIndex: activeIndex});
    }
  }

  handleTabChange = (e, {activeIndex}) => {
    let path = '';
    switch (activeIndex) {
      default:
      case 0:
        path = 'overview';
        break;
      case 1:
        path = 'announcements';
        break;
      case 2:
        path = 'settings';
        break;
      case 3:
        path = 'users';
        break;
      case 4:
        path = 'growth';
        break;
      case 5:
        path = 'conversations';
        break;
      case 6:
        path = 'services';
        break;
      case 7:
        path = 'design';
        break;
    }

    this.setState({ activeIndex });
    this.props.navigate('/settings/admin/' + path);
  }

  render () {
    const { stats, inquiries, invitation,  } = this.props;
    const {activeIndex } = this.state;

    // Admin Tabs
    // TODO: add users to admin settings
    // TODO: add pagination to users
    const panes = [
      {
        menuItem: 'Overview', render: () =>
        <Tab.Pane loading={stats.loading}>
          <AdminOverviewTab {...this.props} />
        </Tab.Pane>
      },
      {
        menuItem: 'Announcements', render: () =>
        <Tab.Pane loading={this.state.loading}>
          <AnnouncementCreator></AnnouncementCreator>
        </Tab.Pane>
      },
      {
        menuItem: 'Settings', render: () =>
        <Tab.Pane loading={this.state.loading}>
          <AdminSettingsTab {...this.props} />
        </Tab.Pane>
      },
      {
        menuItem: 'Users', render: () =>
        <Tab.Pane loading={this.state.loading} className='col-center'>
          <AdminUsersTab {...this.props} />
          {/* <AccountCreator register={register} onRegisterSuccess={onRegisterSuccess} auth={this.props.auth}/> */}
        </Tab.Pane>
      },
      {
        menuItem: 'Growth', render: () =>
        <Tab.Pane loading={inquiries.loading || invitation.loading}>
          <AdminGrowthTab {...this.props} />
        </Tab.Pane>
      },
      {
        menuItem: 'Conversations', render: () =>
        <Tab.Pane loading={this.state.loading}>
          <AdminConversationsTab {...this.props} />
        </Tab.Pane>,
      },
      {
        menuItem: 'Services', render: () =>
        <Tab.Pane loading={this.state.loading}>
          <AdminServicesTab {...this.props} />
        </Tab.Pane>
      },
      {
        menuItem: 'Design', render: () =>
        <Tab.Pane loading={this.state.loading}>
          <AdminDesign {...this.props} />
        </Tab.Pane>
      }
    ];

    return (
      <sensemaker-admin-settings class='fade-in'style={{ height: '100%' }}>
        <Segment fluid style={{ height: '100%', overflowX: 'hidden'}}>
          <Header as='h2'>Admin</Header>
          <p><strong>Debug:</strong> <code>{this.settings.debug}</code></p>
          <Tab panes={panes} activeIndex={activeIndex} onTabChange={this.handleTabChange}/>
        </Segment>
      </sensemaker-admin-settings>
    );
  }
}

module.exports = withNavigate(AdminSettings);
//module.exports = AdminSettings;
