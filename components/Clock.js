'use strict';

const React = require('react');

const {
  Card
} = require('semantic-ui-react');

// TODO: reduce to a web component (no react)
class Clock extends React.Component {
  constructor (props) {
    super(props);

    this.creation = new Date();
    this.settings = Object.assign({
      clock: 0,
      debug: false,
      interval: 1000
    }, props);

    this.heart = null;

    this.state = {
      content: {
        clock: this.settings.clock,
        interval: this.settings.interval
      }
    };
  }

  componentDidMount () {
    this.start();
  }

  render () {
    const now = new Date();
    return (
      <Card>
        <Card.Content>
          <Card.Header>{now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}</Card.Header>
          {this.settings.debug ? (
            <Card.Description>
              <pre><code>{JSON.stringify(this.state, null, '  ')}</code></pre>
            </Card.Description>
          ) : null}
        </Card.Content>
      </Card>
    );
  }

  start () {
    this.heart = setInterval(() => {
      this.setState({
        content: {
          clock: this.state.content.clock + 1,
          interval: this.settings.interval
        }
      });
    }, this.settings.interval);
  }

  stop () {
    clearInterval(this.heart);
  }
}

module.exports = Clock;
