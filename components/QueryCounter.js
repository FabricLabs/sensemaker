'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Button,
  Header,
  Image,
  Label,
  Progress,
  Segment
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
      <sensemaker-query-counter style={{ width: '16em', ...this.props.style }}>
        <Segment>
          <jeeves-plan-selection>
            <Progress percent={this.state.percent} data-value={{used}} data-total={{max}} />
          </jeeves-plan-selection>
        </Segment>
      </sensemaker-query-counter>
    );
  }
}

module.exports = QueryCounter;
