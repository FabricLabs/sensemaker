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
const DiscordUserCard = require('./DiscordUserCard');

// Functions
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class DiscordChannelList extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      discord: {},
      state: {
        discord: {
          guild: {},
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
    this.props.fetchDiscordChannels();
    this.watcher = setInterval(() => {
      this.props.fetchDiscordChannels();
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
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={discord?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}>{discord.guild.name}</Header>
        </Segment>
        <Header as='h2'>{discord && discord.guild && discord.guild.members && discord.guild.members.length} Members</Header>
        <Card.Group loading={discord.loading}>
          {discord && discord.channels && discord.channels.map((id) => (
            <Card key={id}>
              <Card.Content>
                <Card.Header>
                  <Link to={`/services/discord/guild/${id}`}>{truncateMiddle(discord.channels[id].name, 20)}</Link>
                </Card.Header>
                <Card.Meta>
                  <span className='date'>{toRelativeTime(discord.channels[id].created_at)}</span>
                </Card.Meta>
                <Card.Description>
                  {discord.channels[id].description}
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <Link to={`/services/discord/guild/${id}`}>
                  <Icon name='user' />
                  {discord.channels[id].members.length} Members
                </Link>
              </Card.Content>
            </Card>
          ))}
        </Card.Group>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Channel (props) {
  const { id } = useParams();
  return <DiscordChannelList {...props} id={id} />;
}

module.exports = Channel;
