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
        <Header as='h4'>Users</Header>
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
          <Segment>
            <Header as='h3'>Metrics</Header>
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
          </Segment>

          <Header as='h3'>Settings</Header>
          <p><strong>Debug:</strong> <code>{this.settings.debug}</code></p>

          <Tab panes={panes} />

          <Header as='h3'>Collections</Header>
          <Header as='h4'>Waitlist</Header>
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
                  <Button>Send</Button>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>

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
          <AnnouncementCreator></AnnouncementCreator>
          <AccountCreator register={register} error={error} onRegisterSuccess={onRegisterSuccess} />
        </Segment>
      </jeeves-admin-settings>
    );
  }
}

module.exports = AdminSettings;
