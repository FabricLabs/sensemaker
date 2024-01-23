'use strict';

const React = require('react');

const {
  Button,
  Table,
  Message,
  Header,
  Segment,
  Input
} = require('semantic-ui-react');
const store = require('../stores/redux');

class AdminInquiries extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      sent: false,
      errorSending: false,
      sendingInvitationId: null, //this is used to know exactly wich inquiry we are sending so it changes uses the loading icon and messages
      searchQuery: '',
    };
  }

  componentDidMount() {
    this.props.fetchInquiries();
  }

  createInvitation = async (email, id) => {

    this.setState({ sendingInvitationId: id }); // Set the sending invitation ID

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch timed out"));
      }, 60000);
    });

    try {
      const response = await Promise.race([timeoutPromise, this.props.sendInvitation(email)]);
      if (this.props.invitation.current.ok) {
        //first timeout is to show the loading icon
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.setState({ sent: true });
        //second timeout its after setting "sent" to true to show the message "invitation sent" before fetching for Inquiries wich
        //updates the Inquiries list, and not being displayed in this list anymore
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(error.message);
      this.setState({ errorSending: true });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      await this.props.fetchInquiries();
      await this.props.fetchInvitations();
      this.setState({ sendingInvitationId: null, sent: false, errorSending: false }); // Reset the sending invitation ID
    }
  }

  deleteInquiry = async (ID) => {
    try {
      await this.props.deleteInquiry(ID);
    } catch (error) {
      console.log(error);
    } finally {
      await this.props.fetchInquiries();
    }

  }

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };


  render() {
    const { sent, sendingInvitationId, errorSending } = this.state;
    const { inquiries } = this.props;

    return (
      <section>
        <div className='growth-section-head'>
          <Header as='h3' >Waitlist</Header>
          <Input
            icon='search'
            placeholder='Find by email'
            name='searchQuery'
            onChange={this.handleInputChange}
            style={{ marginLeft: '20px' }}>
          </Input>
        </div>
        <Segment style={{ overflow: 'auto', maxHeight: '40vh', padding: '0' }}>
          <Table celled striped size='small'>
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
                          {(sent && sendingInvitationId === instance.id && !errorSending) &&
                            <Message positive textAlign="center" size='small'>
                              <Message.Content>
                                Invitation Sent
                              </Message.Content>
                            </Message>
                          }
                          {(sendingInvitationId === instance.id && errorSending) &&
                            <Message negative textAlign="center" size='small'>
                              <Message.Content>
                                Invitation not sent, try again later
                              </Message.Content>
                            </Message>
                          }
                          {((!sent || sendingInvitationId !== instance.id) && !errorSending) && (
                            <Button
                              icon='send'
                              size='mini'
                              loading={sendingInvitationId === instance.id}
                              onClick={() => this.createInvitation(instance.email, instance.id)}
                              content='Send Invitation'
                            />
                          )}
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Button
                            icon='trash alternate'
                            disabled={sendingInvitationId === instance.id}
                            onClick={() => this.deleteInquiry(instance.id)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    )
                  }
                })}
            </Table.Body>
          </Table>
        </Segment>
      </section>
    );
  };
}


module.exports = AdminInquiries;
