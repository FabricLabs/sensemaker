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

class AdminInvitations extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sent: false,
            errorSending: false,
            sendingInvitationId: null, //this is used to know exactly wich inquiry we are sending so it changes uses the loading icon and messages
            showAllInvitations: false,
        };
    }

    componentDidMount() {
        this.props.fetchInvitations();
    }

    toggleShowAllInvitations = () => {
        this.setState(prevState => ({
            showAllInvitations: !prevState.showAllInvitations
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
                //second timeout its after setting "sent" to true to show the message "invitation sent" before fetching for Invitations wich
                //updates the Invitations list, with this one changing its status to "Invited" and not being displayed (see below in render)
                await new Promise((resolve) => setTimeout(resolve, 3000));
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
        const { sent, sendingInvitationId, errorSending, showAllInvitations } = this.state;
        const { invitation } = this.props;

        return (
            <section>
                <div className='growth-section-head'>
                    <Header as='h4' style={{ margin: '0' }}>Invitations</Header>
                    <Checkbox
                        toggle
                        label='Show All'
                        onChange={this.toggleShowAllInvitations}
                        checked={showAllInvitations}
                    />
                </div>
                <Segment style={{ overflow: 'auto', maxHeight: '40vh', padding: '0' }}>
                    <Table celled striped>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell textAlign="center" width={1}>ID</Table.HeaderCell>
                                <Table.HeaderCell width={4}>Date</Table.HeaderCell>
                                <Table.HeaderCell width={4}>Email</Table.HeaderCell>
                                <Table.HeaderCell width={2}>Status</Table.HeaderCell>
                                <Table.HeaderCell textAlign="center" width={1}>Times Sent</Table.HeaderCell>
                                {/* <Table.HeaderCell textAlign="center" style={{maxWidth: '60px'}} width={2}>Times Sent</Table.HeaderCell> */}
                                <Table.HeaderCell textAlign="center" width={4}>Invite</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {invitation && invitation.invitations && invitation.invitations.map(instance => {
                                if (showAllInvitations || instance.status === 'pending') {
                                    return (
                                        <Table.Row key={instance.id}>
                                            <Table.Cell textAlign="center">{instance.id}</Table.Cell>
                                            <Table.Cell>{instance.created_at}</Table.Cell>
                                            <Table.Cell>{instance.target}</Table.Cell>
                                            <Table.Cell >{instance.status}</Table.Cell>
                                            <Table.Cell textAlign="center" >{instance.invitation_count}</Table.Cell>
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
                                                {((!sent || sendingInvitationId !== instance.id) && instance.status === 'pending') && (
                                                    <Button
                                                        icon='redo'
                                                        loading={sendingInvitationId === instance.id}
                                                        onClick={() => this.sendInvitation(instance.target, instance.id)}
                                                        content='Send Again'
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
                </Segment>
            </section>
        );
    };
}


module.exports = AdminInvitations;
