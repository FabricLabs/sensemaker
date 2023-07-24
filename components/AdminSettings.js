'use strict';

const React = require('react');

const {
  Button,
  Header,
  Segment,
  Statistic,
  Table
} = require('semantic-ui-react');

const AccountCreator = require('./AccountCreator');

class AdminSettings extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      waitlistSignupCount: 0
    };
  }

  componentDidMount () {
    this.props.fetchAdminStats();
  }

  render () {
    const { login, register, error, onLoginSuccess, onRegisterSuccess } = this.props;
    const { waitlistSignupCount } = this.state;

    return (
      <jeeves-admin-settings>
        <Header>Admin</Header>
        <Segment>
          <Header as='h3'>Metrics</Header>
          <Statistic>
            <Statistic.Value>{waitlistSignupCount}</Statistic.Value>
            <Statistic.Label>Waiting</Statistic.Label>
          </Statistic>
        </Segment>
        <Header>Settings</Header>
        <Header>Collections</Header>
        <Header as='h3'>Invitations</Header>
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
