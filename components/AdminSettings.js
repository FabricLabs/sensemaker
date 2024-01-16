'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Header,
  Icon,
  Label,
  List,
  Segment,
  Statistic,
  Tab,
  Table,
  Pagination,
  Divider,
  Loader
} = require('semantic-ui-react');

const AccountCreator = require('./AccountCreator');
const AnnouncementCreator = require('./AnnouncementCreator');
const AdminInquiries = require('./AdminSettingsInquiries')
// const ConversationList = require('./ConversationList');

class AdminSettings extends React.Component {
  constructor (props) {
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

  componentDidMount () {
    this.props.fetchAdminStats();
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

  render () {
    const { login, register, error, onLoginSuccess, onRegisterSuccess, conversations, stats, inquiries  } = this.props;
    const { currentPage, windowWidth } = this.state;

    // Math for pagination of conversation list
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

    const inquiriesTotal = stats?.inquiries?.total ?? 0;
    const invitationsTotal = stats?.invitations?.total ?? 0;
    const usersTotal = stats?.users?.total ?? 0;

    // Admin Tabs
    // TODO: add users to admin settings
    // TODO: add pagination to users
    const panes = [
      { menuItem: 'Overview', render: () => <Tab.Pane loading={stats.loading}>
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
        <Header as='h4'>Resources</Header>
        <List>
          <List.Item>
            <Icon name='file alternate outline' />
            <a href="/courts.sql">Courts (SQL)</a>
          </List.Item>
        </List>
      </Tab.Pane> },
      { menuItem: 'Training', render: () => <Tab.Pane loading={this.state.loading}>
        <Header as='h4'>Datasets</Header>
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell></Table.Cell>
              <Table.Cell>CaselawAccessProject (Harvard)</Table.Cell>
              <Table.Cell><Label>started</Label></Table.Cell>
              <Table.Cell>
                <Label><Icon name='check' />Cases</Label>
                <Label><Icon name='check' />Courts</Label>
              </Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell></Table.Cell>
              <Table.Cell>CourtListener</Table.Cell>
              <Table.Cell><Label>started</Label></Table.Cell>
              <Table.Cell>
                <Label><Icon name='remove' />Cases</Label>
                <Label><Icon name='check' />Courts</Label>
              </Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell></Table.Cell>
              <Table.Cell>PACER</Table.Cell>
              <Table.Cell><Label>started</Label></Table.Cell>
              <Table.Cell>
                <Label><Icon name='remove' />Cases</Label>
                <Label><Icon name='check' />Courts</Label>
              </Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Tab.Pane> },
      { menuItem: 'Growth', render: () => <Tab.Pane loading={false}>
        <Header as='h4'>Metrics</Header>
        <Statistic>
          <Statistic.Value>???</Statistic.Value>
          <Statistic.Label><abbr title="0 of 0 comments were positive">Accuracy</abbr></Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{usersTotal}</Statistic.Value>
          <Statistic.Label>Users</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>0</Statistic.Value>
          <Statistic.Label>Conversations</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>0</Statistic.Value>
          <Statistic.Label>Messages</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>0</Statistic.Value>
          <Statistic.Label><abbr title="Feedback on a message, with sentiment and (optionally) rating, content, etc.">Comments</abbr></Statistic.Label>
        </Statistic>
        <AdminInquiries inquiries={inquiries} fetchInquiries={this.props.fetchInquiries} sendInvitation={this.props.sendInvitation} invitation={this.props.invitation}/>
        <Header as='h4'>Invitations</Header>
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell>
                <Button>Re-send</Button>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Tab.Pane> },
      { menuItem: 'Agents', render: () => <Tab.Pane loading={this.state.loading}>
       <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Model</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>@sensemaker/core</Table.Cell>
              <Table.Cell>sensemaker-0.2.0-RC1</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>@jeeves/core</Table.Cell>
              <Table.Cell>jeeves-0.1.0-RC1</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Mistral 7B</Table.Cell>
              <Table.Cell>mistral-7b</Table.Cell>
              <Table.Cell><Label>stopped</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>GPT 3.5 Turbo</Table.Cell>
              <Table.Cell>gpt-3.5-turbo</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>GPT 4</Table.Cell>
              <Table.Cell>gpt-4</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>GPT 4 32k</Table.Cell>
              <Table.Cell>gpt-4-32k</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>GPT 4 Turbo</Table.Cell>
              <Table.Cell>gpt-4-turbo</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Falcon 40B</Table.Cell>
              <Table.Cell>falcon-40b</Table.Cell>
              <Table.Cell><Label>stopped</Label></Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Tab.Pane> },
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
                <Divider style={{marginTop: '0.3em',marginBottom:'0.3em'}}/>
              </div>
            ))}
          </container>
          <Pagination
            size='tiny'
            activePage={currentPage}
            totalPages={Math.ceil(conversations.length / itemsPerPage)}
            onPageChange={this.handlePaginationChange}
            ellipsisItem={(windowWidth>480)? undefined : null}
            firstItem={(windowWidth>480)? undefined : null}
            lastItem={(windowWidth>480)? undefined : null}
            boundaryRange={(windowWidth>480) ? 1 : 0}
            style={{marginTop: '1em'}}
          />
        </Tab.Pane>,
      },
      { menuItem: 'Users', render: () => <Tab.Pane loading={this.state.loading}>
        <Header as='h3'>Create User</Header>
        <AccountCreator register={register} error={error} onRegisterSuccess={onRegisterSuccess} />
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Username</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell>Modified</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.props.users && this.props.users.users && this.props.users.users.length > 0 ? (
              this.props.users.users.map((instance) => (
                <Table.Row key={instance.id}>
                  <Table.Cell>{instance.id}</Table.Cell>
                  <Table.Cell>{instance.username}</Table.Cell>
                  <Table.Cell>{instance.created_at}</Table.Cell>
                  <Table.Cell>{instance.modified_at}</Table.Cell>
                  <Table.Cell>
                    <Button>Reactivate</Button>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (<Loader active inline="centered" />)}
          </Table.Body>
        </Table>
      </Tab.Pane> },
      { menuItem: 'Services', render: () => <Tab.Pane loading={this.state.loading}>
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
              <Table.Cell><Label>started</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>@jeeves/core</Table.Cell>
              <Table.Cell><Label>started</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>JeevesAI</Table.Cell>
              <Table.Cell><Label>started</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>JeevesAI JSON Case Names</Table.Cell>
              <Table.Cell><Label>stopped</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>JeevesAI JSON Case Validator</Table.Cell>
              <Table.Cell><Label>stopped</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>PACER</Table.Cell>
              <Table.Cell><Label>stopped</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>CaselawAccessProject</Table.Cell>
              <Table.Cell><Label>stopped</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>CourtListener</Table.Cell>
              <Table.Cell><Label>started</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell>
                <Button.Group>
                  <Button>restart</Button>
                  <Button>stop</Button>
                </Button.Group>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Tab.Pane> },
      { menuItem: 'Settings', render: () => <Tab.Pane loading={this.state.loading}>
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
      </Tab.Pane> }
    ];

    return (
      <jeeves-admin-settings class='fade-in'>
        <Segment fluid style={{ marginRight: '1em' }}>
          <Header as='h2'>Admin</Header>
          <p><strong>Debug:</strong> <code>{this.settings.debug}</code></p>

          <Tab panes={panes} />
          <AnnouncementCreator></AnnouncementCreator>
        </Segment>
      </jeeves-admin-settings>
    );
  }
}

module.exports = AdminSettings;
