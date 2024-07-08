'use strict';

const React = require('react');

const {
  Label, Header, Table, Button, Icon
} = require('semantic-ui-react');


class AdminServicesTab extends React.Component {
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
    this.props.syncRedisQueue();
    //this is not doing anything yet
    //this.props.fetchAllConversationsFromAPI();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  componentDidUpdate() {
    console.log(this.props.redis);
  }

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  clearRedisQueue = async () => {
    await this.props.clearQueue();
    await this.props.syncRedisQueue();
  }

  render() {
    const { queue, lastJobCompleted, lastJobTaken } = this.props.redis;

    return (
      <adminServicesTab>
        <Header as='h3'>Services</Header>
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Last Update</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>@fabric/core</Table.Cell>
              <Table.Cell><Label>started (implicit)</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>@sensemaker/core</Table.Cell>
              <Table.Cell><Label>started (implicit)</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>@jeeves/core</Table.Cell>
              <Table.Cell><Label>started (implicit)</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>MySQL</Table.Cell>
              <Table.Cell><Label>unknown</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Ollama</Table.Cell>
              <Table.Cell><Label>unknown</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <Header as='h3'>Redis</Header>
        <Button icon onClick={this.clearRedisQueue}><Icon name='trash alternate outline'/></Button>
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={4}></Table.HeaderCell>
              <Table.HeaderCell width={2}>Jobs</Table.HeaderCell>
              <Table.HeaderCell width={2}>Params</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell><Header as='h5'>Last job Taken</Header></Table.Cell>
              <Table.Cell><Label>{lastJobTaken ? lastJobTaken.method : 'Empty'}</Label></Table.Cell>
              <Table.Cell><Label>{lastJobTaken ? lastJobTaken.params : 'Empty'}</Label></Table.Cell>
              <Table.Cell>{lastJobTaken?.status ? <Label color='blue'>{lastJobTaken.status}</Label> : ''}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><Header as='h5'>Last job Completed</Header></Table.Cell>
              <Table.Cell><Label>{lastJobCompleted ? lastJobCompleted.method : 'Empty'}</Label></Table.Cell>
              <Table.Cell><Label>{lastJobCompleted ? lastJobCompleted.params : 'Empty'}</Label></Table.Cell>
              <Table.Cell>{lastJobCompleted?.status ?
                <Label color={lastJobCompleted.status === 'COMPLETED' ? 'green' : 'red'}>{lastJobCompleted.status}</Label> : ''}
              </Table.Cell>
            </Table.Row>
            {(queue?.length > 0) ? (
              <Table.Row>
                <Table.Cell><Header as='h5'>Queue</Header></Table.Cell>
                <Table.Cell>{queue?.map((instance) => (<div><Label style={{ margin: 'auto 0 0.3em 0' }}>{instance.method}</Label></div>))}</Table.Cell>
                <Table.Cell>{queue?.map((instance) => (<div><Label style={{ margin: 'auto 0 0.3em 0' }}>{instance.params[0]}</Label></div>))}</Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            ) : (
              <Table.Row>
                <Table.Cell><Header as='h5'>Queue</Header></Table.Cell>
                <Table.Cell><Label>Empty</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            )
            }
          </Table.Body>
        </Table>
      </adminServicesTab>
    )
  }
}

module.exports = AdminServicesTab;