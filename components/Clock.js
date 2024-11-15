'use strict';

const {
  Card
} = require('semantic-ui-react');

class Clock extends React.Component {
  constructor (props) {
    super(props);

    this.creation = new Date();
    this.settings = Object.assign({
      clock: 0,
      interval: 1000
    }, props);

    this.state = {
      content: {
        clock: this.settings.clock,
        interval: this.settings.interval
      }
    };
  }

  render () {
    const now = new Date();
    return (
      <Card>
        <Card.Content>
          <Card.Header>{this.now.toLocaleString('en-US', { hour: 'numeric', hour12: true })}</Card.Header>
          <Card.Description>
            <pre><code>{JSON.stringify(this.state, null, '  ')}</code></pre>
          </Card.Description>
        </Card.Content>
        
      </Card>
    );
  }
}

module.exports = Clock;
