'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams, useSearchParams } = require('react-router-dom');

// Components
// Semantic UI
const {
  Breadcrumb,
  Button,
  Form,
  Header,
  Icon,
  Segment,
  Table
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');

// Functions
const toRelativeTime = require('../functions/toRelativeTime');
const truncateMiddle = require('../functions/truncateMiddle');

class AgentPage extends React.Component {
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

    this.chatBoxRef = React.createRef();

    return this;
  }

  componentDidMount () {
    this.props.fetchAgent(this.props.id);
    this.watcher = setInterval(() => {
      this.props.fetchAgent(this.props.id);
    }, 60000);

    // Focus chat input if action=chat
    if (this.props.action === 'chat') {
      setTimeout(() => {
        if (this.chatBoxRef.current) {
          this.chatBoxRef.current.focus();
        }
      }, 100);
    }
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { agents } = this.props;
    console.debug('[AGENTS]', 'State:', agents);

    // Safely extract agent data and ensure they are strings
    const agentName = (agents?.agent?.name && typeof agents.agent.name === 'string') ? agents.agent.name : 'Loading...';
    const agentDescription = (agents?.agent?.description && typeof agents.agent.description === 'string') ? agents.agent.description : 'Loading...';

    // Handle prompt - it might be a Buffer object
    let agentPrompt = 'Loading...';
    if (agents?.agent?.prompt) {
      if (typeof agents.agent.prompt === 'string') {
        agentPrompt = agents.agent.prompt || 'No prompt configured';
      } else if (Buffer.isBuffer(agents.agent.prompt)) {
        agentPrompt = agents.agent.prompt.toString('utf8') || 'No prompt configured';
      } else if (agents.agent.prompt.type === 'Buffer' && Array.isArray(agents.agent.prompt.data)) {
        // Handle serialized Buffer object
        agentPrompt = Buffer.from(agents.agent.prompt.data).toString('utf8') || 'No prompt configured';
      }
    }

    const agentId = (agents?.agent?.id && (typeof agents.agent.id === 'string' || typeof agents.agent.id === 'number')) ? agents.agent.id : null;

    return (
      <div className='fade-in'>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/agents'>Agents</Link></Breadcrumb.Section>
            <Breadcrumb.Divider icon='right chevron' />
            <Breadcrumb.Section active>{agentName}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={agents?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='user' />{agentName}</Header>
          <p>{agentDescription}</p>
          <Header as='h3'>Prompt</Header>
          <div>
            <div>{agentPrompt}</div>
          </div>
        </Segment>
        <ChatBox
          {...this.props}
          ref={this.chatBoxRef}
          agent={agentId}
          messagesEndRef={this.messagesEndRef}
          includeFeed={true}
          placeholder={`Your request for ${agentName}...`}
          resetInformationSidebar={this.props.resetInformationSidebar}
          messageInfo={this.props.messageInfo}
          thumbsUp={this.props.thumbsUp}
          thumbsDown={this.props.thumbsDown}
            />
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function AgentView (props) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  return <AgentPage {...props} id={id} action={action} />;
}

module.exports = AgentView;
