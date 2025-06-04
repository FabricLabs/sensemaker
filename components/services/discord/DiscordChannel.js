'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const {
  Link,
  useParams
} = require('react-router-dom');

// Components
// Semantic UI
const {
  Breadcrumb,
  Button,
  Card,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

// Local Components
// const DiscordChannelCard = require('./DiscordChannelCard');

// Functions
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class DiscordChannel extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      discord: {},
      state: {
        discord: {
          channel: {},
          channels: []
        }
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state
    };

    // Fabric State
    this._state = {
      discord: {
        channels: {}
      },
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchDiscordChannel(this.props.id);
    this.watcher = setInterval(() => {
      this.props.fetchDiscordChannel(this.props.id);
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { discord } = this.props;
    console.debug('[DISCORD]', 'Service:', discord);
    return (
      <div style={{ minHeight: '100%', maxHeight: '100%', overflowY: 'auto' }}>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/discord'>Discord</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section><Link to='/services/discord/channels'>Channels</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section>{discord.channel?.name || 'Loading...'}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={discord?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}>{discord.channel?.name || 'Loading...'}</Header>
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function User (props) {
  const { id } = useParams();
  return <DiscordChannel id={id} {...props} />;
}

module.exports = User;
