'use strict';

const React = require('react');

const {
    Button,
    Table,
    Message,
    Header,
    Checkbox,
    Segment
} = require('semantic-ui-react');
const store = require('../stores/redux');

class AdminInquiries extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sent: false,
            errorSending: false,
            sendingInvitationId: null, //this is used to know exactly wich inquiry we are sending so it changes uses the loading icon and messages
        };
    }

    componentDidMount() {
        this.props.fetchInquiries();
    }

    sendInvitation = async (email, id) => {
        const state = store.getState();
        const token = state.auth.token;

        this.setState({ sendingInvitationId: id }); // Set the sending invitation ID

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Fetch timed out"));
            }, 15000);
        });

        try {
            const response = await Promise.race([timeoutPromise, this.props.sendInvitation(email)]);
            if (this.props.invitation.current.ok) {
                //first timeout is to show the loading icon
                await new Promise((resolve) => setTimeout(resolve, 1500));
                this.setState({ sent: true });
                //second timeout its after setting "sent" to true to show the message "invitation sent" before fetching for Inquiries wich
                //updates the Inquiries list, and not being displayed in this list anymore
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await this.props.fetchInquiries();
                await this.props.fetchInvitations();
            } else {
                console.error("API request failed with status:", response.status);
            }
        } catch (error) {
            console.log(error.message);
            this.setState({ errorSending: true });
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } finally {
            this.setState({ sendingInvitationId: null, sent: false, errorSending: false }); // Reset the sending invitation ID
        }
    }

    render() {
        const { sent, sendingInvitationId, errorSending } = this.state;
        const { inquiries } = this.props;

        return (
            <section>
                <Header as='h4' >Waitlist</Header>
                <Segment style={{ overflow: 'auto', maxHeight: '40vh', padding: '0' }}>
                    <Table celled striped>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell textAlign="center" width={1}>ID</Table.HeaderCell>
                                <Table.HeaderCell width={5}>Date</Table.HeaderCell>
                                <Table.HeaderCell width={5}>Email</Table.HeaderCell>
                                <Table.HeaderCell textAlign="center" width={5}>Invite</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {inquiries && inquiries.inquiries && inquiries.inquiries.map(instance => {
                                return (
                                    <Table.Row key={instance.id}>
                                        <Table.Cell textAlign="center">{instance.id}</Table.Cell>
                                        <Table.Cell>{instance.created_at}</Table.Cell>
                                        <Table.Cell>{instance.email}</Table.Cell>
                                        <Table.Cell textAlign="center">
                                            {(sent && sendingInvitationId === instance.id && !errorSending) &&
                                                <Message positive textAlign="center">
                                                    <Message.Content>
                                                        Invitation Sent
                                                    </Message.Content>
                                                </Message>
                                            }
                                            {(sent && sendingInvitationId === instance.id && errorSending) &&
                                                <Message negative textAlign="center">
                                                    <Message.Content>
                                                        Invitation not sent, try again later
                                                    </Message.Content>
                                                </Message>
                                            }
                                            {(!sent || sendingInvitationId !== instance.id) && (
                                                <Button
                                                    icon='send'
                                                    loading={sendingInvitationId === instance.id}
                                                    onClick={() => this.sendInvitation(instance.email, instance.id)}
                                                    content='Send Invitation'
                                                />
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                )
                            })}
                        </Table.Body>
                    </Table>
                </Segment>
            </section>
        );
    };
}


module.exports = AdminInquiries;
