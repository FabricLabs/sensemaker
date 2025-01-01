'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Breadcrumb,
  Button,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

const toRelativeTime = require('../../functions/toRelativeTime');
const truncateMiddle = require('../../functions/truncateMiddle');

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
        <Segment loading={discord.loading} style={{ maxHeight: '100%', height: 'auto' }}>
          <div className='guilds'>
            {discord.guilds.map((guild) => (
              <div key={guild.id} className='guild'>
                <h3>{guild.name}</h3>
                <p>{guild.description}</p>
                <p>Members: {guild.members}</p>
                <p>Channels: {guild.channels}</p>
                <p>Created: {toRelativeTime(guild.created)}</p>
              </div>
            ))}
          </div>
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DiscordHome;
