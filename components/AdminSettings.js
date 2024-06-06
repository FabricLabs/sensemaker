'use strict';

// Dependencies
const React = require('react');
const { Link} = require('react-router-dom');

// Semantic UI
const {
  Button,
  Divider,
  Header,
  Icon,
  Label,
  List,
  Loader,
  Pagination,
  Progress,
  Segment,
  Statistic,
  Tab,
  Table
} = require('semantic-ui-react');

const withNavigate = require('../components/Navigate');
const toRelativeTime = require('../functions/toRelativeTime');

// Components
// const AccountCreator = require('./AccountCreator');
const AnnouncementCreator = require('./AnnouncementCreator');
const AdminOverviewTab = require('./tabs/admin/overview');
const AdminSettingsTab = require('./tabs/admin/settings');
const AdminUsersTab = require ('./tabs/admin/users');
const AdminGrowthTab = require('./tabs/admin/growth');
const AdminDesign = require ('./tabs/admin/design');
const AdminConversationsTab = require('./tabs/admin/conversations');
const AdminServicesTab = require('./tabs/admin/services');
// const ConversationList = require('./ConversationList');


//TODO: add history push to different tabs
class AdminSettings extends React.Component {
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
        activeIndex: 0,
        windowWidth: window.innerWidth,
        currentPane:'',
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount() {
    this.props.fetchAdminStats();
    const path = this.props.location.pathname;
    this.setState({activeIndex: this.props.activeIndex})
    // let activeIndex = 0;
    // if (path === '/settings/admin/Settings') activeIndex = 1;
    // else if (path === '/settings/admin/Users') activeIndex = 2;
    // this.setState({activeIndex: activeIndex });
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
  
  componentDidUpdate(prevProps) {
    const {activeIndex} = this.props
    if (prevProps.activeIndex !== activeIndex ) {
      this.setState({activeIndex: activeIndex})
    }
  }

  handleTabChange = (e, {activeIndex}) => {
    let path = '';
    switch(activeIndex) {
      case 0:
        path = 'Overview';
        break;
      case 1:
        path = 'Settings';
        break;
      case 2:
        path = 'Users';
        break;
      case 3:
        path = 'Growth';
        break;
      case 4:
        path = 'Conversations';
        break;
      case 5:
        path = 'Services';
        break;
      case 6:
        path = 'Design';
        break;      
      default:
        path = 'Overview';
    }
    this.setState({ activeIndex });

    this.props.navigate('/settings/admin/' + path)
  }

  render() {
    const start = new Date();
    const { login, register, error, onLoginSuccess, onRegisterSuccess, conversations, stats, inquiries, invitation,  } = this.props;
    const { currentPage, windowWidth, activeIndex } = this.state;

    // Math for pagination of conversation list
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

    const inquiriesTotal = stats?.inquiries?.total ?? 0;
    const inquiriesWaiting = stats?.inquiries?.waiting ?? 0;
    const invitationsTotal = stats?.invitations?.total ?? 0;
    const usersTotal = stats?.users?.total ?? 0;


    // Admin Tabs
    // TODO: add users to admin settings
    // TODO: add pagination to users
    const panes = [
      {
        menuItem: 'Overview', render: () => 
        <Tab.Pane loading={stats.loading}>
          <AdminOverviewTab {...this.props}/>
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
        menuItem: 'Design', render: () => <Tab.Pane loading={this.state.loading}>
          <AdminDesign {...this.props}/>
        </Tab.Pane>
      }
    ];

    return (
      <jeeves-admin-settings class='fade-in'style={{ height: '100%' }}>
        <Segment fluid style={{ height: '100%', overflowX: 'hidden'}}>
          <Header as='h2'>Admin</Header>
          <p><strong>Debug:</strong> <code>{this.settings.debug}</code></p>
          <Tab panes={panes} activeIndex={activeIndex} onTabChange={this.handleTabChange}/>
          <AnnouncementCreator></AnnouncementCreator>
        </Segment>
      </jeeves-admin-settings>
    );
  }
}

module.exports = withNavigate(AdminSettings);
//module.exports = AdminSettings;