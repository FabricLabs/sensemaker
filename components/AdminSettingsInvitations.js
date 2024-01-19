'use strict';

const React = require('react');

const {
    Button,
    Table,
    Message,
    Header,
    Checkbox,
    Segment,
    Input
} = require('semantic-ui-react');
const store = require('../stores/redux');

class AdminInvitations extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sent: false,
            errorSending: false,
            sendingInvitationID: null, //this is used to know exactly wich inquiry we are sending so it changes uses the loading icon and messages
            showAllInvitations: false,
            searchQuery: '',
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

    reSendInvite = async (ID) => {

        this.setState({ sendingInvitationID: ID }); // Set the sending invitation ID

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Fetch timed out"));
            }, 15000);
        });

        try {
            const response = await Promise.race([timeoutPromise, this.props.reSendInvitation(ID)]);
            if (this.props.invitation.current && this.props.invitation.current.ok) {
                //first timeout is to show the loading icon
                await new Promise((resolve) => setTimeout(resolve, 1500));
                this.setState({ sent: true });
                await this.props.fetchInvitations();
                //second timeout its after setting "sent" to true to show the message "invitation sent" before fetching for Invitations wich
                //updates the Invitations list, with this one changing its status to "Invited" and not being displayed (see below in render)
                await new Promise((resolve) => setTimeout(resolve, 3000));
            } else {
                console.log("vino por este else");
            }
        } catch (error) {
            this.setState({ errorSending: true });
            await new Promise((resolve) => setTimeout(resolve, 3000));
        } finally {
            this.setState({ sendingInvitationID: null, sent: false, errorSending: false }); // Reset the sending invitation ID
        }
    }

    deleteInvite = async (ID) => {

        try {
            // const response = await Promise.race([timeoutPromise, this.props.reSendInvitation(ID)]);
            // if (this.props.invitation.current && this.props.invitation.current.ok) {
            //     //first timeout is to show the loading icon
            //     await new Promise((resolve) => setTimeout(resolve, 1500));
            //     this.setState({ sent: true });
            //     await this.props.fetchInvitations();
            //     //second timeout its after setting "sent" to true to show the message "invitation sent" before fetching for Invitations wich
            //     //updates the Invitations list, with this one changing its status to "Invited" and not being displayed (see below in render)
            //     await new Promise((resolve) => setTimeout(resolve, 3000));
            // } else {
            //     console.log("vino por este else");
            // }
            console.log('Deleting Invite ', ID, 'not ready yet');
        } catch (error) {
            // this.setState({ errorSending: true });
            // await new Promise((resolve) => setTimeout(resolve, 3000));
            console.log(error);
        } finally {
            this.props.fetchInvitations();
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
        const { sent, sendingInvitationID, errorSending, showAllInvitations } = this.state;
        const { invitation } = this.props;

        return (
            <section>
                <div className='growth-section-head'>
                    <Header as='h4' style={{ margin: '0' }}>Invitations</Header>
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
                    <Table celled striped size='small'>
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
                                    if (instance.status === 'pending') {
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
                                                        onClick={() => this.deleteInvite(instance.id)}
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
            </section>
        );
    };
}


module.exports = AdminInvitations;
