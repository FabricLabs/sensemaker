'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Form,
  Header,
  Icon,
  Label,
  Segment,
  Table,
  Modal
} = require('semantic-ui-react');

const toRelativeTime = require('../../../functions/toRelativeTime');

class AdminAgentsTab extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      debug: false,
      agents: {},
      state: {
        agents: {},
        modalOpen: false
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount () {
    this.props.fetchAgentStats();
    this.watcher = setInterval(() => {
      this.props.fetchAgentStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { agents } = this.props;
    return (
      <adminAgentsTab>
        <Segment className='fade-in' loading={agents?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h3'>Agents</Header>
          <p>Agents are automated intelligences operating under your direction.</p>
        </Segment>
        <Header as='h4'>
          System Agents
          <Button floated='right' primary onClick={() => this.setState({ modalOpen: true })}><Icon name='plus' /> Create Agent</Button>
        </Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Agent</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {agents && agents.agents && agents.agents.map((agent) => (
              <Table.Row key={agent.id}>
                <Table.Cell><Link to={`/agents/${agent.id}`}>{agent.name}</Link> <Label><abbr title={agent.created_at}>{toRelativeTime(agent.created_at)}</abbr></Label></Table.Cell>
                <Table.Cell>{agent.status}</Table.Cell>
                <Table.Cell>{agent.description}</Table.Cell>
                <Table.Cell>
                  <Button.Group>
                    <Button icon as={Link} to={`/agents/${agent.id}`}><Icon name='pencil' /></Button>
                    <Button icon as={Link} to={`/agents/${agent.id}`}><Icon name='cog' /></Button>
                    <Button icon as={Link} to={`/agents/${agent.id}?action=chat`}><Icon name='chat' /></Button>
                  </Button.Group>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <Modal
          open={this.state.modalOpen}
          onClose={() => this.setState({ modalOpen: false })}
          size='small'
          className='fade-in'
        >
          <Modal.Header>Create New Agent</Modal.Header>
          <Modal.Content>
            <Form loading={agents?.loading} onSubmit={(e) => {
              e.preventDefault();
              fetch('/agents', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: e.target[0].value,
                  prompt: e.target[1].value
                })
              }).then((res) => {
                this.state.loading = false;
                this.state.name = '';
                this.state.prompt = '';
                this.props.fetchAgentStats();
                this.setState({ modalOpen: false });
              });
              return false;
            }}>
              <Form.Field>
                <label>Agent Name</label>
                <Form.Input
                  placeholder='Enter a name for your agent'
                  name='name'
                  required
                />
              </Form.Field>
              <Form.Field>
                <label>Agent Prompt</label>
                <Form.TextArea
                  placeholder="Describe your agent's behavior and capabilities..."
                  name='prompt'
                  required
                  style={{ minHeight: '150px' }}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  type='submit'
                  primary
                  fluid
                  content='Create Agent' 
                />
              </Form.Field>
            </Form>
          </Modal.Content>
        </Modal>
      </adminAgentsTab>
    );
  }
}

module.exports = AdminAgentsTab; 