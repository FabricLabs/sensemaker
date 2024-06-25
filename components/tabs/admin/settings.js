'use strict';

const React = require('react');
const {
  Header, Table
} = require('semantic-ui-react');

class AdminSettingsTab extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'JEEVES',
        name: 'jeeves',
        statistics: {
          counts: {
            waitlist: 0,
            pending: 0, // pending invitations
            users: 0,
            conversations: 0,
            messages: 0,
            courts: 0,
            cases: 0,
            documents: 0
          }
        },
        waitlistSignupCount: 0,
        currentPage: 1,
        windowWidth: window.innerWidth
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount() {
    this.props.fetchAdminStats();
    //this is not doing anything yet
    //this.props.fetchAllConversationsFromAPI();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  };

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  render () {

    return ( 
      <adminSettingsTab>
        <Header as='h4'>Settings</Header>
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Value</Table.HeaderCell>
              <Table.HeaderCell>Modified</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>alias</Table.Cell>
              <Table.Cell>{this.state.alias}</Table.Cell>
              <Table.Cell><abbr title=""></abbr></Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </adminSettingsTab>
    )
  }
}

module.exports = AdminSettingsTab;