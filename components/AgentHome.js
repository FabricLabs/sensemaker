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
  Segment,
  Table
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
      ...this.settings.state
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
    console.debug('[AGENTS]', 'State:', agents);
    return (
      <div>
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
        <Header as='h2'>Your Agents</Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Agent</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Controls</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell>Updated</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {agents && agents.agents && agents.agents.map((agent) => (
              <Table.Row key={agent.id}>
                <Table.Cell><Link to={`/agents/${agent.id}`}>{agent.name}</Link></Table.Cell>
                <Table.Cell>{agent.status}</Table.Cell>
                <Table.Cell>
                  <Button.Group basic className='desktop-only'>
                    {(agent.can_edit) ? (<Button icon><Icon name='play' /></Button>) : null}
                    {(agent.can_edit) ? (<Button icon disabled={true}><Icon name='pause' /></Button>) : null}
                    {(agent.can_edit) ? (<Button icon disabled={true}><Icon name='stop' /></Button>) : null}
                  </Button.Group>
                </Table.Cell>
                <Table.Cell>{toRelativeTime(agent.created_at)}</Table.Cell>
                <Table.Cell>{toRelativeTime(agent.updated_at)}</Table.Cell>
                <Table.Cell>
                  <Icon name='pencil' />
                  <Icon name='trash' />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <Form className='fade-in' style={{ marginTop: '1em' }} loading={agents?.loading} onSubmit={(e) => {
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
          });
          return false;
        }}>
          <Form.Group>
            <Form.Input placeholder='Agent Name' name='name' />
            <Form.TextArea placeholder='Prompt' name='prompt' />
            <Form.Button type='submit' content='Create Agent' />
          </Form.Group>
        </Form>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = AgentHome;
