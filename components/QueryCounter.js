'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Button,
  Header,
  Image,
  Label,
  Progress
} = require('semantic-ui-react');

class QueryCounter extends React.Component {
  state = {
    value: 30,
    percent: 100
  }

  render () {
    const max = '∞';
    const used = 0;

    return (
      <sensemaker-query-counter>
        <Progress percent={this.state.percent} label={max + ' requests remaining'} />
      </sensemaker-query-counter>
    );
  }
}

module.exports = QueryCounter;
