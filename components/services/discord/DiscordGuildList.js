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
// const DiscordUserCard = require('./DiscordUserCard');

// Functions
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class GuildList extends React.Component {
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
    this.props.fetchDiscordGuilds();
    this.watcher = setInterval(() => {
      this.props.fetchDiscordGuilds();
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
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={discord?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}>{discord.guild.name}</Header>
        </Segment>
        <Header as='h2'>{discord && discord.guilds && discord.guilds.length} Guilds</Header>
        <Card.Group loading={discord.loading}>
          {discord && discord.guilds && discord.guilds.map((guild) => (
            <Card key={guild.id}>
              <Card.Content>
                <Card.Header>
                  <Link to={`/services/discord/guilds/${guild.id}`}>{guild.name}</Link>
                </Card.Header>
                <Card.Meta>
                  <span>{guild.id}</span>
                </Card.Meta>
                <Card.Description>
                  <p>{guild.description}</p>
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <Icon name='user' />
                {guild.members.length} Members
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

function Guild (props) {
  const { id } = useParams();
  return <GuildList {...props} id={id} />;
}

module.exports = Guild;
