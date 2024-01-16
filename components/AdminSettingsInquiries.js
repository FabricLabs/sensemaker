'use strict';

const React = require('react');

const {
    Button,
    Table,
    Message
} = require('semantic-ui-react');
const store = require('../stores/redux');

class AdminInquiries extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sent: false,
            errorSending: false,
            sendingInvitationId: null,
        };
    }

    componentDidMount() {
        this.props.fetchInquiries();
    }

    sendInvitation = async (email, id) => {
        const state = store.getState();
        const token = state.auth.token;

        this.setState({ sendingInvitationId: id }); // Set the sending invitation ID

        // const fetchPromise = fetch("/invitations", {
        //     method: "POST",
        //     headers: {
        //         Authorization: `Bearer ${token}`,
        //         "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({ email }),
        // });
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Fetch timed out"));
            }, 15000);
        });

        try {
            const response = await Promise.race([timeoutPromise, this.props.sendInvitation(email,token)]);
            if (this.props.invitation.current.ok) {
                console.log("ENTRO POR EL OK", response);
                await new Promise((resolve) => setTimeout(resolve, 1500));
                this.setState({ sent: true });
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
                console.error("API request failed with status:", response.status);
            }
            await this.props.fetchInquiries();
        } catch (error) {
            console.log(error.message);
            this.setState({errorSending: true});
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } finally {
            this.setState({ sendingInvitationId: null, sent: false, errorSending: false }); // Reset the sending invitation ID
        }
    }

    render() {
        const { sent, sendingInvitationId, errorSending } = this.state;
        const { inquiries } = this.props;
        console.log("el state de invitaciones",this.props);
        return (
            <div style={{ overflow: 'auto', maxHeight: '40vh' }}>
                <Table celled striped loading={inquiries.loading}>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>ID</Table.HeaderCell>
                            <Table.HeaderCell>Date</Table.HeaderCell>
                            <Table.HeaderCell>Email</Table.HeaderCell>
                            <Table.HeaderCell>Status</Table.HeaderCell>
                            <Table.HeaderCell></Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body loading={inquiries.loading}>
                        {inquiries && inquiries.inquiries && inquiries.inquiries.map(instance => {
                            if (instance.status === 'waiting') {
                                return (
                                    <Table.Row key={instance.id}>
                                        <Table.Cell>{instance.id}</Table.Cell>
                                        <Table.Cell>{instance.created_at}</Table.Cell>
                                        <Table.Cell>{instance.email}</Table.Cell>
                                        <Table.Cell >{instance.status}</Table.Cell>
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
                                );
                            }
                            return null;
                        })}
                    </Table.Body>
                </Table>
            </div>
        );
    };
}


module.exports = AdminInquiries;
