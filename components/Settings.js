'use strict';

const React = require('react');

const {
  Card,
  Header,
  Label,
  Segment
} = require('semantic-ui-react');

const QueryCounter = require('./QueryCounter');

class JeevesUserSettings extends React.Component {
  render () {
    return (
      <jeeves-user-settings>
        <Segment>
          <Header as='h1'>Settings</Header>
          <Header as='h2'>Billing</Header>
          <Card>
            <Card.Content>
              <Header as='h4'>Usage</Header>
              <QueryCounter />
            </Card.Content>
          </Card>
          <Header as='h3'>Current Plan</Header>
          <Card>
            <Card.Content>
              <Header as='h4'>Guest Pass</Header>
              <p>
                <span>Free</span><br />
                <strong>Renewal:</strong> <Label>disabled</Label>
              </p>
            </Card.Content>
          </Card>
        </Segment>
      </jeeves-user-settings>
    );
  }
};

module.exports = JeevesUserSettings;
