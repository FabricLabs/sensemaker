'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams } = require('react-router-dom');

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

    return this;
  }

  componentDidMount () {
    this.props.fetchAgent(this.props.id);
    this.watcher = setInterval(() => {
      this.props.fetchAgent(this.props.id);
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
            <Breadcrumb.Divider icon='right chevron' />
            <Breadcrumb.Section active>{agents.agent?.name || 'Loading...'}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={agents?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='user' />{agents.agent?.name || 'Loading...'}</Header>
          <p>{agents.agent?.description || 'Loading...'}</p>
          <Header as='h3'>Prompt</Header>
          <div>
            <div>{agents.agent?.prompt || 'Loading...'}</div>
          </div>
        </Segment>
        <ChatBox
              {...this.props}
              agent={agents?.agent.id}
              messagesEndRef={this.messagesEndRef}
              includeFeed={true}
              placeholder={`Your request for ${agents?.agent.name}...`}
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
  return <AgentPage {...props} id={id} />;
}

module.exports = AgentView;
