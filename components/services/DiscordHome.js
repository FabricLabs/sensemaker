'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

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
const ChatBox = require('../ChatBox');

// const toRelativeTime = require('../../functions/toRelativeTime');
// const truncateMiddle = require('../../functions/truncateMiddle');

class DiscordHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      discord: {},
      state: {
        discord: {
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
    this.props.fetchDiscordStats();
    this.watcher = setInterval(() => {
      this.props.fetchDiscordStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { discord } = this.props;
    console.debug('[DISCORD]', 'Service:', discord);
    return (
      <div>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/discord'>Discord</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={discord?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='discord' />Discord</Header>
          <p>Discord is a popular social network for gamers.</p>
        </Segment>
        <Header as='h2'>Guilds</Header>
        <Card.Group className='guilds' loading={discord.loading}>
          {discord.guilds.slice(0, 2).map((guild) => (
            <Card key={guild.id} as={Link} to={`/services/discord/guilds/${guild.id}`}>
              <Card.Content>
                <Card.Header>{guild.name}</Card.Header>
                <p>{guild.description}</p>
              </Card.Content>
            </Card>
          ))}
          <Card>
            <Card.Content>
              <Card.Header>Add Your Guild &raquo;</Card.Header>
              <p>Authorize the SENSEMAKER application on Discord to add your Guild.</p>
            </Card.Content>
            <Card.Content extra>
              <a href='/services/discord/authorize' className='ui icon button'><Icon name='plus' /> Add Guild</a>
            </Card.Content>
          </Card>
        </Card.Group>
        <ChatBox {...this.props} context={{ discord: discord }} placeholder='Ask about Discord...' />
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DiscordHome;
