'use strict';

const React = require('react');

const {
  Button,
  Table,
  Message,
  Header,
  Segment,
  Input,
  Modal,
  Popup,
  Confirm
} = require('semantic-ui-react');
const store = require('../stores/redux');

const UsernameEditModal = require('./AdminSettingsUsernameModal');

class AdminUsers extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      usernameEditModal: false, //to open de username edit modal
      userIdEditing: null,
      usernameEditing: '',
      confirmResetOpen: false,
      emailReseting: null,
    };
  }

  componentDidMount() {
    this.props.fetchUsers();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.users !== this.props.users) {
      const { users } = this.props;

    }
  };

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  reloadUsers = async () => {
    await this.props.fetchUsers();
  }

  // Toggle the modal
  toggleUsernameModal = () => {
    this.setState(prevState => ({
      usernameEditModal: !prevState.usernameEditModal
    }));
  };

  changeUsername = (oldUsername, id) => {
    this.setState({ usernameEditing: oldUsername, userIdEditing: id, usernameEditModal: true });
    // this.toggleUsernameModal;
  }

  confirmResetPassword = (email) => {
    this.setState({ emailReseting: email, confirmResetOpen: true });
  }

  render() {
    // const { sent, sendingInvitationID, errorSending } = this.state;
    const { users } = this.props;

    return (
      <section className='fade-in users-section'>
        <div className='users-section-head'>
          <Header as='h3'>Users</Header>
          <div>
            <Button
              icon='redo'
              title='Update users'
              size='medium'
              onClick={this.reloadUsers}
              basic
              style={{ border: 'none', backgroundColor: 'transparent', boxShadow: 'none' }}
            />
            <Input
              icon='search'
              placeholder='Find by email/username'
              name='searchQuery'
              onChange={this.handleInputChange}
              style={{ marginLeft: '20px' }}>
            </Input>
          </div>
        </div>
        <Segment style={{ overflow: 'auto', maxHeight: '40vh', padding: '0' }} loading={this.props.users.loading}>
          <Table celled striped size='small'>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell textAlign="center" width={1}>ID</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={2}>Username</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={1}>Is Admin</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={2}>Email</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={3}>Created</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={3}>Modified</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={4}>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users && users.users && users.users
                .filter(instance =>
                  (instance.email ? (instance.email.toLowerCase().includes(this.state.searchQuery.toLowerCase())) : (this.state.searchQuery ? false : true)) ||
                  (instance.username.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
                )
                .map(instance => {
                  return (
                    <Table.Row key={instance.id}>
                      <Table.Cell textAlign="center">{instance.id}</Table.Cell>
                      <Table.Cell textAlign="center">{instance.username}</Table.Cell>
                      <Table.Cell textAlign="center">{instance.is_admin ? 'Yes' : 'No'}</Table.Cell>
                      <Table.Cell textAlign="center">{instance.email ? instance.email : null}</Table.Cell>
                      <Table.Cell textAlign="center">{this.formatDateTime(instance.created_at)}</Table.Cell>
                      <Table.Cell textAlign="center">{this.formatDateTime(instance.updated_at)}</Table.Cell>
                      <Table.Cell textAlign="center">
                        <Popup
                          content="Change Username"
                          trigger={
                            <Button
                              icon='user'
                              disabled={false}
                              onClick={() => this.changeUsername(instance.username, instance.id)}
                            />
                          }
                        />
                        <Popup
                          content="Add/Change Email"
                          trigger={
                            <Button
                              icon='at'
                              disabled={false}
                            />
                          }
                        />
                        <Popup
                          content="Send password reset"
                          trigger={
                            <Button
                              icon='key'
                              disabled={false}
                              onClick={() => this.confirmResetPassword(instance.email)}
                            />
                          }
                        />
                        <Popup
                          content="Disable User"
                          trigger={
                            <Button
                              icon='ban'
                              disabled={false}
                            />
                          }
                        />
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
            </Table.Body>
          </Table>
        </Segment>
        <Confirm
          open={this.state.confirmResetOpen}
          content={'Do you want to send a reset link to: ' + this.state.emailReseting + ' ?'}
          onConfirm={this.props.askPasswordReset(this.state.emailReseting)}
          size='tiny'
        />
        <UsernameEditModal {...this.props} open={this.state.usernameEditModal} id={this.state.userIdEditing} oldUsername={this.state.usernameEditing} toggleUsernameModal={this.toggleUsernameModal} />
      </section>
    );
  };
}


module.exports = AdminUsers;
