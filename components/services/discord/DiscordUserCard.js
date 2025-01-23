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
  Card
} = require('semantic-ui-react');

// Functions
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class DiscordUserCard extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      discord: {},
      includeGuild: false,
      state: {
        user: {}
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state
    };

    // Fabric State
    this._state = {
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchDiscordUser(this.props.id);
    this.watcher = setInterval(() => {
      this.props.fetchDiscordUser(this.props.id);
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { discord } = this.props;
    console.debug('[DISCORD:USER]', 'Service:', discord);
    return (
      <Card key={this.props.key} as={Link} to={`/services/discord/users/${this.props.id}`}>
        <Card.Content>
          <Card.Header>{discord.user?.globalName || 'Loading...'}</Card.Header>
          <p></p>
        </Card.Content>
      </Card>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DiscordUserCard;
