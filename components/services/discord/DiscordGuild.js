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

class DiscordGuild extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      discord: {},
      state: {
        discord: {
          guild: {},
          guilds: []
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
        guilds: {}
      },
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchDiscordGuild(this.props.id);
    this.watcher = setInterval(() => {
      this.props.fetchDiscordGuild(this.props.id);
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
            <Breadcrumb.Section><Link to='/services/discord/guilds'>Guilds</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section>{discord.guild?.name || 'Loading...'}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={discord?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}>{discord.guild.name}</Header>
        </Segment>
        <Header as='h2'>{discord && discord.guild && discord.guild.members && discord.guild.members.length} Members</Header>
        <Card.Group loading={discord.loading}>
          {discord && discord.guild && discord.guild.members && discord.guild.members.slice(0, 5).map((id, i) => (
            <DiscordUserCard {...this.props} key={i} id={id} />
          ))}
          <Card as={Link} to={`/services/discord/guilds/${discord.guild.id}/members`}>
            <Card.Content>
              <Card.Header>...</Card.Header>
              <p>View all members</p>
            </Card.Content>
          </Card>
        </Card.Group>
        <Header as='h2'>{discord && discord.guild && discord.guild.channels && discord.guild.channels.length} Channels</Header>
        <Card.Group loading={discord.loading}>
          {discord && discord.guild && discord.guild.channels && discord.guild.channels.slice(0, 5).map((id, i) => (
            <Card key={i} id={id} className='channel' as ={Link} to={`/services/discord/channels/${id}`}>
              <Card.Content>
                <Card.Header>{id}</Card.Header>
                <p>{id}</p>
              </Card.Content>
            </Card>
          ))}
          <Card as={Link} to={`/services/discord/guilds/${discord.guild.id}/channels`}>
            <Card.Content>
              <Card.Header>...</Card.Header>
              <p>View all channels</p>
            </Card.Content>
          </Card>
        </Card.Group>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Guild (props) {
  const { id } = useParams();
  return <DiscordGuild {...props} id={id} />;
}

module.exports = Guild;
