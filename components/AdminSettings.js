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
const AdminInquiries = require('./AdminSettingsInquiries');
const AdminInvitations = require('./AdminSettingsInvitations');
const AdminUsers = require('./AdminSettingsUsers');
const AdminHelp = require('./AdminSettingsHelp');
const SignUpForm = require('./SignUpForm');
const AdminOverview = require('./tabs/admin/overview');
const AdminDesign = require ('../components/tabs/admin/design');
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
  
  // componentDidUpdate() {

  // }

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
          <AdminOverview {...this.props}/>
        </Tab.Pane>
      },
      {
        menuItem: 'Settings', render: () => <Tab.Pane loading={this.state.loading}>
          <Header as='h4'>Settings</Header>
          <Table celled striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Value</Table.HeaderCell>
                <Table.HeaderCell>Modified</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>alias</Table.Cell>
                <Table.Cell>{this.state.alias}</Table.Cell>
                <Table.Cell><abbr title=""></abbr></Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Tab.Pane>
      },
      {
        menuItem: 'Users', render: () => <Tab.Pane loading={this.state.loading} className='col-center'>
          <AdminUsers {...this.props} />
          <AdminHelp {...this.props}/>
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
          {/* <AccountCreator register={register} onRegisterSuccess={onRegisterSuccess} auth={this.props.auth}/> */}
        </Tab.Pane>
      },
      {
        menuItem: 'Growth', render: () => <Tab.Pane loading={inquiries.loading || invitation.loading}>
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
        </Tab.Pane>
      },
      {
        menuItem: 'Conversations',
        render: () => <Tab.Pane loading={this.state.loading}>
          <container>
            {currentConversations.map(conversation => (
              <div key={conversation.id}>
                <Link to={'/conversations/' + conversation.id}>
                  <span><Label>{conversation.creator_name || 'you'}</Label></span>&nbsp;
                  <abbr title={conversation.created_at}>{new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</abbr>{": "}
                  <span>{conversation.title}</span>
                </Link>
                <Divider style={{ marginTop: '0.3em', marginBottom: '0.3em' }} />
              </div>
            ))}
          </container>
          <Pagination
            size='tiny'
            activePage={currentPage}
            totalPages={Math.ceil(conversations.length / itemsPerPage)}
            onPageChange={this.handlePaginationChange}
            ellipsisItem={(windowWidth > 480) ? undefined : null}
            firstItem={(windowWidth > 480) ? undefined : null}
            lastItem={(windowWidth > 480) ? undefined : null}
            boundaryRange={(windowWidth > 480) ? 1 : 0}
            style={{ marginTop: '1em' }}
          />
        </Tab.Pane>,
      },
      {
        menuItem: 'Services', render: () => <Tab.Pane loading={this.state.loading}>
          <Header as='h4'>Services</Header>
          <Table celled striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Last Update</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>@fabric/core</Table.Cell>
                <Table.Cell><Label>started (implicit)</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>@sensemaker/core</Table.Cell>
                <Table.Cell><Label>started (implicit)</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>@jeeves/core</Table.Cell>
                <Table.Cell><Label>started (implicit)</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Redis</Table.Cell>
                <Table.Cell><Label>unknown</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>MySQL</Table.Cell>
                <Table.Cell><Label>unknown</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Ollama</Table.Cell>
                <Table.Cell><Label>unknown</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
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