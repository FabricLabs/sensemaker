'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Breadcrumb,
  Button,
  Form,
  Header,
  Icon,
  Label,
  Segment,
  Table,
  Modal
} = require('semantic-ui-react');

const toRelativeTime = require('../functions/toRelativeTime');
const truncateMiddle = require('../functions/truncateMiddle');

class AgentHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      agents: {},
      state: {
        agents: {}
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state,
      modalOpen: false
    };

    // Fabric State
    this._state = {
      agents: {
        guilds: {}
      },
      content: this.settings.state
    };

    return this;
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
      <div className='fade-in'>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/agents'>Agents</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={agents?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='user' />Agents</Header>
          <p>Agents are automated intelligences operating under your direction.</p>
        </Segment>
        <Header as='h2'>
          Your Agents
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
              console.debug('Create Agent target:', e.target);
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
                console.debug('Create Agent Response:', res);
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
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = AgentHome;
