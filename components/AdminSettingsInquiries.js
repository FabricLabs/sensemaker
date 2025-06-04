'use strict';

const React = require('react');

const {
  Button,
  Table,
  Message,
  Header,
  Segment,
  Input,
  Modal
} = require('semantic-ui-react');

class AdminInquiries extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      sent: false,
      errorSending: false,
      sendingInvitationID: null, //this is used to know exactly wich inquiry we are sending so it changes uses the loading icon and messages
      searchQuery: '',
      confirmDeleteModalOpen: false,
      deleteInquiryID: null,
    };
  }

  componentDidMount () {
    this.props.fetchInquiries();
  }

  componentDidUpdate (prevProps) {
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
      await this.props.fetchInquiries();
      await this.props.fetchInvitations();
    } else {
      this.setState({ errorSending: true });
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    this.setState({ sendingInvitationID: null, sent: false, errorSending: false }); // Reset the sending invitation ID
  }

  createInvitation = async (email, id) => {

    this.setState({ sendingInvitationID: id }); // Set the sending invitation ID
    try {
      await this.props.sendInvitation(email);
    } catch (error) {
      console.log(error.message);
      this.setState({ errorSending: true });
    }
  }


  openConfirmDeleteModal = (ID) => {
    this.setState({ confirmDeleteModalOpen: true, deleteInquiryID: ID });
  }

  closeConfirmDeleteModal = () => {
    this.setState({ confirmDeleteModalOpen: false, deleteInquiryID: null });
  }

  confirmDelete = async () => {
    const { deleteInquiryID } = this.state;
    if (deleteInquiryID) {
      try {
        await this.props.deleteInquiry(deleteInquiryID);
      } catch (error) {
        console.log(error);
      } finally {
        await this.props.fetchInquiries();
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
        <Modal.Header>Delete Inquiry</Modal.Header>
        <Modal.Content>
          <p>Are you sure you want to delete this inquiry?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button secondary onClick={this.closeConfirmDeleteModal}>No</Button>
          <Button negative onClick={this.confirmDelete}>Yes, delete it</Button>
        </Modal.Actions>
      </Modal>
    )
  }

  formatDateTime (dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  reloadInquiries = async () => {
    await this.props.fetchInquiries();
  }


  render () {
    const { sent, sendingInvitationID, errorSending } = this.state;
    const { inquiries } = this.props;

    return (
      <section className='fade-in'>
        <div className='growth-section-head'>
          <Header as='h3'>Waitlist</Header>
          <div>
            <Button
              icon='redo'
              title='Update inquiries'
              size='medium'
              onClick={this.reloadInquiries}
              basic
              style={{border: 'none', backgroundColor: 'transparent', boxShadow: 'none'}}
            />
          <Input
            icon='search'
            placeholder='Find by email'
            name='searchQuery'
            onChange={this.handleInputChange}
            style={{ marginLeft: '20px' }}>
          </Input>
          </div>
        </div>
        <Segment style={{ overflow: 'auto', maxHeight: '40vh', padding: '0' }}>
          <Table celled striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell textAlign="center" width={1}>ID</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={5}>Date</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={5}>Email</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={4}>Invite</Table.HeaderCell>
                <Table.HeaderCell textAlign="center" width={1}>Delete</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {inquiries && inquiries.inquiries && inquiries.inquiries
                .filter(instance =>
                  instance.email.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
                .map(instance => {
                  if (instance.status === 'waiting') {
                    return (
                      <Table.Row key={instance.id}>
                        <Table.Cell textAlign="center">{instance.id}</Table.Cell>
                        <Table.Cell textAlign="center">{this.formatDateTime(instance.created_at)}</Table.Cell>
                        <Table.Cell textAlign="center">{instance.email}</Table.Cell>
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
                          {((!sent || sendingInvitationID !== instance.id) && !errorSending) && (
                            <Button
                              icon='send'
                              size='mini'
                              loading={sendingInvitationID === instance.id}
                              onClick={() => this.createInvitation(instance.email, instance.id)}
                              content='Send Invitation'
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
                    )
                  }
                })}
            </Table.Body>
          </Table>
        </Segment>
        {this.renderConfirmModal()}
      </section>
    );
  };
}


module.exports = AdminInquiries;
