'use strict';

const React = require('react');

const {
  Button,
  Table,
  Message,
  Header,
  Checkbox,
  Segment,
  Input,
  Modal
} = require('semantic-ui-react');
const store = require('../stores/redux');

class AdminInvitations extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      sent: false,
      errorSending: false,
      sendingInvitationID: null, //this is used to know exactly wich inquiry we are sending so it changes uses the loading icon and messages
      searchQuery: '',
      showPending: true, // state for pending checkbox
      showAccepted: false, // state for accepted checkbox
      showDeclined: false, // state for declined checkbox
      confirmDeleteModalOpen: false,
      deleteInvitationID: null,
    };
  }

  componentDidMount() {
    this.props.fetchInvitations();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.invitation !== this.props.invitation) {
      const { invitation } = this.props;
      const { sendingInvitationID } = this.state;

      //if sendingInvitationID is not null its beacause we are sending an invitation
      if (sendingInvitationID && !invitation.sending) {
        this.delayedFetchInvitations();
      }
    }
  };

  delayedFetchInvitations = async () => {

    if (this.props.invitation.invitationSent) {
      this.setState({ sent: true });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await this.props.fetchInvitations();
    } else {
      this.setState({ errorSending: true });
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    this.setState({ sendingInvitationID: null, sent: false, errorSending: false }); // Reset the sending invitation ID
  }

  reSendInvite = async (ID) => {

    this.setState({ sendingInvitationID: ID }); // Set the sending invitation ID

    try {
      await this.props.reSendInvitation(ID);

    } catch (error) {
      console.log(error);
      this.setState({ errorSending: true });
    }
  }

  openConfirmDeleteModal = (ID) => {
    this.setState({ confirmDeleteModalOpen: true, deleteInvitationID: ID });
  }

  closeConfirmDeleteModal = () => {
    this.setState({ confirmDeleteModalOpen: false, deleteInvitationID: null });
  }

  confirmDelete = async () => {
    const { deleteInvitationID } = this.state;
    if (deleteInvitationID) {
      try {
        await this.props.deleteInvitation(deleteInvitationID);
      } catch (error) {
        console.log(error);
      } finally {
        await this.props.fetchInvitations();
      }
      this.closeConfirmDeleteModal();
    }
  }

  renderConfirmModal = () => {
    return (
      <Modal
        size='mini'
        open={this.state.confirmDeleteModalOpen}
        onClose={this.closeConfirmDeleteModal}
      >
        <Modal.Header>Delete Invitation</Modal.Header>
        <Modal.Content>
          <p>Are you sure you want to delete this invitation?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button secondary onClick={this.closeConfirmDeleteModal}>No</Button>
          <Button negative onClick={this.confirmDelete}>Yes, delete it</Button>
        </Modal.Actions>
      </Modal>
    )
  }

  formatDateTime = (dateTimeStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  toggleCheckbox = (checkboxName) => {
    this.setState(prevState => ({
      [checkboxName]: !prevState[checkboxName]
    }));
  }

  render() {
    const { sent, sendingInvitationID, errorSending, showPending, showAccepted, showDeclined } = this.state;
    const { invitation } = this.props;

    return (
      <section className='fade-in'>
        <div className='growth-section-head'>
          <Header as='h3' style={{ margin: '0' }}>Invitations</Header>
          <Checkbox
            label='Pending'
            name='showPending'
            onChange={() => this.toggleCheckbox('showPending')}
            defaultChecked
          />
          <Checkbox
            label='Accepted'
            name='showAccepted'
            onChange={() => this.toggleCheckbox('showAccepted')}

          />
          <Checkbox
            label='Declined'
            name='showDeclined'
            onChange={() => this.toggleCheckbox('showDeclined')}

          />
          <Input
            icon='search'
            placeholder='Find by Email/Sender'
            name='searchQuery'
            onChange={this.handleInputChange}
            style={{ marginLeft: '20px' }}
          >
          </Input>
        </div>
        <Segment style={{ overflow: 'auto', maxHeight: '40vh', padding: '0' }}>
          <Table celled striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell textAlign="center" width={1}>ID</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={1}>Sender</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={4}>Date</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={5}>Email</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={1}>Status</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={1}>Times Sent</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={2}>Invite</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={1}>Delete</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {invitation && invitation.invitations && invitation.invitations
                .filter(instance =>
                  instance.target.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
                  instance.sender_username.toLowerCase().includes(this.state.searchQuery.toLowerCase())
                )
                .map(instance => {
                  if ((instance.status === 'pending' && showPending) ||
                    (instance.status === 'accepted' && showAccepted) ||
                    (instance.status === 'declined' && showDeclined)
                  ) {
                    return (
                      <Table.Row key={instance.id}>
                        <Table.Cell textAlign="center">{instance.id}</Table.Cell>
                        <Table.Cell textAlign="center">{instance.sender_username}</Table.Cell>
                        <Table.Cell textAlign="center">{this.formatDateTime(instance.created_at)}</Table.Cell>
                        <Table.Cell textAlign="center">{instance.target}</Table.Cell>
                        <Table.Cell textAlign="center">{instance.status}</Table.Cell>
                        <Table.Cell textAlign="center">{instance.invitation_count}</Table.Cell>
                        <Table.Cell textAlign="center">
                          {(sent && sendingInvitationID === instance.id && !errorSending) &&
                            <Message positive textAlign="center" size='small'>
                              <Message.Content>
                                Invitation Sent
                              </Message.Content>
                            </Message>
                          }
                          {(sendingInvitationID === instance.id && errorSending) &&
                            <Message negative textAlign="center" size='small'>
                              <Message.Content>
                                Invitation not sent, try again later
                              </Message.Content>
                            </Message>
                          }
                          {((!sent || sendingInvitationID !== instance.id) && instance.status === 'pending' && !errorSending) && (
                            <Button
                              size='mini'
                              loading={sendingInvitationID === instance.id}
                              onClick={() => this.reSendInvite(instance.id)}
                              content='Re-Send'
                            />
                          )}

                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Button
                            icon='trash alternate'
                            disabled={sendingInvitationID === instance.id}
                            onClick={() => this.openConfirmDeleteModal(instance.id)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    );
                  }
                  return null;
                })}
            </Table.Body>
          </Table>
        </Segment>
        {this.renderConfirmModal()}
      </section>
    );
  };
}


module.exports = AdminInvitations;
