'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Header,
  Segment,
  Statistic,
  Table
} = require('semantic-ui-react');

const AccountCreator = require('./AccountCreator');
// const ConversationList = require('./ConversationList');

class AdminSettings extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      state: {
        waitlistSignupCount: 0
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount () {
    this.props.fetchAdminStats();
  }

  render () {
    const { login, register, error, onLoginSuccess, onRegisterSuccess, conversations } = this.props;
    const { waitlistSignupCount } = this.state;

    return (
      <jeeves-admin-settings>
        <Header as='h2'>Admin</Header>
        <Segment>
          <Header as='h3'>Metrics</Header>
          <Statistic>
            <Statistic.Value>{waitlistSignupCount}</Statistic.Value>
            <Statistic.Label>Waiting</Statistic.Label>
          </Statistic>
        </Segment>
        <Header as='h3'>Settings</Header>
        <p><strong>Debug:</strong> <code>{this.settings.debug}</code></p>
        <Header as='h3'>Collections</Header>
        <Header as='h4'>Conversations</Header>
        {conversations && conversations.length > 0 && conversations.map(conversation => (
          <div key={conversation.id}>
            <Link to={'/conversations/' + conversation.id}>{conversation.title}</Link>
            <p>{conversation.content}</p>
          </div>
        ))}
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
                <Button>Send</Button>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <AccountCreator register={register} error={error} onRegisterSuccess={onRegisterSuccess} />
      </jeeves-admin-settings>
    );
  }
}

module.exports = AdminSettings;
