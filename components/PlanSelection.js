'use strict';

// Dependencies
const React = require('react');
const { connect } = require('react-redux');

// Semantic UI
const {
  Button,
  Header,
  Image,
  Label
} = require('semantic-ui-react');

class PlanSelection extends React.Component {
  render () {
    return (
      <jeeves-plan-selection>
        <fabric-card-content>
          <div class="ui segment">
            <h2>Select your plan</h2>
          </div>
        </fabric-card-content>
      </jeeves-plan-selection>
    );
  }
}

module.exports = PlanSelection;
