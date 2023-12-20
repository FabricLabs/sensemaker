'use strict';

const React = require('react');

const {
  Button,
  Card,
  Header,
  Label,
  Segment,
  Table,
} = require('semantic-ui-react');

const QueryCounter = require('./QueryCounter');
const PasswordChangeModal = require('./SettingsPasswordModal');
const UserChangeModal = require('./SettingsUserModal');

class JeevesUserSettings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: this.props.auth.username,
      email: this.props.auth.email,
      isPasswordModalOpen: false,
      isUserModalOpen: false,
    };
  }

  // Toggle the modal
  togglePasswordModal = () => {
    this.setState(prevState => ({
      isPasswordModalOpen: !prevState.isPasswordModalOpen
    }));
  };
  // Toggle the modal
  toggleUserModal = () => {
    this.setState(prevState => ({
      isUserModalOpen: !prevState.isUserModalOpen
    }));
  };

  render() {

    const { username, email } = this.state;
    console.log("las props", this.props);

    return (
      <jeeves-user-settings class='fade-in'>
        <Segment fluid style={{ marginRight: '1em' }} textAlign='center'>
          <Header as='h1' textAlign='center'>Settings</Header>
          <container className='settings-container' >
            <Header as='h2'>Account</Header>
            <Table>
              <Table.Header>
                <Table.Row className='settings-row'>
                  <Table.HeaderCell>
                    <Header as='h3'>Profile</Header>
                  </Table.HeaderCell>
                  <Table.HeaderCell />
                  <Table.HeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row className='settings-row'>
                  <Table.Cell><Header as='h4'>Username:</Header></Table.Cell>
                  <Table.Cell><p>{username}</p></Table.Cell>
                  <Table.Cell textAlign='center'><Button primary >Change</Button></Table.Cell>
                </Table.Row>
                <Table.Row className='settings-row'>
                  <Table.Cell><Header as='h4'>Email:</Header></Table.Cell>
                  <Table.Cell><p>{email}</p></Table.Cell>
                  <Table.Cell />
                </Table.Row>
                <Table.Row className='settings-row'>
                  <Table.Cell><Header as='h4'>Password:</Header></Table.Cell>
                  <Table.Cell><code>*******</code> </Table.Cell>
                  <Table.Cell textAlign='center' onClick={this.togglePasswordModal}><Button primary>Change</Button></Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </container>
          <container className='subscription-container'>
            <div className='subscription-billing'>
              <Header as='h2'>Billing</Header>
              <Card>
                <Card.Content>
                  <Header as='h4'>Usage</Header>
                  <QueryCounter />
                </Card.Content>
              </Card>
            </div>
            <div className='subscription-plan'>
              <Header as='h2'>Current Plan</Header>
              <Card>
                <Card.Content>
                  <Header as='h4'>Guest Pass</Header>
                  <p>
                    <span>Free</span><br />
                    <strong>Renewal:</strong> <Label>disabled</Label>
                  </p>
                </Card.Content>
              </Card>
            </div>
          </container>
        </Segment>
        <PasswordChangeModal
          token={this.props.auth.token}
          open={this.state.isPasswordModalOpen}
          togglePasswordModal={this.togglePasswordModal}
          logout={this.props.logout}
        />
        <UserChangeModal
          token={this.props.auth.token}
          open={this.state.isUserModalOpen}
          togglePasswordModal={this.toggleUserModal}
          logout={this.props.logout}
        />

      </jeeves-user-settings>
    );
  }
};

module.exports = JeevesUserSettings;
