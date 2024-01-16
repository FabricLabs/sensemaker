'use strict';

const React = require('react');

const {
    Button,
    Table,
    Message,
    Header,
    Checkbox
} = require('semantic-ui-react');
const store = require('../stores/redux');

class AdminInquiries extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sent: false,
            errorSending: false,
            sendingInvitationId: null, //this is used to know exactly wich inquiry we are sending so it changes uses the loading icon and messages
            showAllInquiries: false,
        };
    }

    componentDidMount() {
        this.props.fetchInquiries();
    }

    toggleShowAllInquiries = () => {
        this.setState(prevState => ({
            showAllInquiries: !prevState.showAllInquiries
        }));
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
                //updates the Inquiries list, with this one changing its status to "Invited" and not being displayed (see below in render)
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await this.props.fetchInquiries();
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
        const { sent, sendingInvitationId, errorSending, showAllInquiries } = this.state;
        const { inquiries } = this.props;

        return (
            <section>
                <div className='inquiries-head'>
                    <Header as='h4' style={{ margin: '0' }}>Waitlist</Header>
                    <Checkbox
                        toggle
                        label='Show Invited'
                        onChange={this.toggleShowAllInquiries}
                        checked={showAllInquiries}                        
                    />
                </div>
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
                                if (showAllInquiries || instance.status === 'waiting') {
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
                                                {((!sent || sendingInvitationId !== instance.id) && instance.status === 'waiting') && (
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
            </section>
        );
    };
}


module.exports = AdminInquiries;
