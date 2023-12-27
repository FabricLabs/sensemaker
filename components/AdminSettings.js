'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Header,
  Label,
  Segment,
  Statistic,
  Tab,
  Table,
  Pagination,
  Divider
} = require('semantic-ui-react');

const AccountCreator = require('./AccountCreator');
const AnnouncementCreator = require('./AnnouncementCreator');
// const ConversationList = require('./ConversationList');

class AdminSettings extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      state: {
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
    this.props.fetchAllConversationsFromAPI();
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
    const { login, register, error, onLoginSuccess, onRegisterSuccess, conversations } = this.props;
    const { waitlistSignupCount, currentPage, windowWidth } = this.state;

    // Math for pagination of conversation list
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

    // Admin Tabs
    // TODO: add users to admin settings
    // TODO: add pagination to users
    const panes = [
      { menuItem: 'Overview', render: () => <Tab.Pane loading={this.state.loading}>
        <Header as='h4'>Metrics</Header>
        <Statistic>
          <Statistic.Value>{waitlistSignupCount}</Statistic.Value>
          <Statistic.Label>Waiting</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{this.state.statistics.counts.waitlist}</Statistic.Value>
          <Statistic.Label>Sent</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{this.state.statistics.counts.users}</Statistic.Value>
          <Statistic.Label>Users</Statistic.Label>
        </Statistic>
      </Tab.Pane> },
      { menuItem: 'Growth', render: () => <Tab.Pane loading={this.state.loading}>
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
              <Table.Cell>GPT 3.5 Turbo</Table.Cell>
              <Table.Cell>gpt-3.5-turbo</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>GPT 4</Table.Cell>
              <Table.Cell>gpt-4</Table.Cell>
              <Table.Cell><Label>ready</Label></Table.Cell>
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
      </Tab.Pane> },
      { menuItem: 'Services', render: () => <Tab.Pane loading={this.state.loading}>
        <Header as='h4'>Services</Header>
      </Tab.Pane> },
      { menuItem: 'Settings', render: () => <Tab.Pane loading={this.state.loading}>
        <Header as='h4'>Settings</Header>
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
