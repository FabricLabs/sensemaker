'use strict';

const React = require('react');

const {
  Card,
  Header,
  Segment
} = require('semantic-ui-react');

module.exports = class JeevesUserSettings extends React.Component {
  render () {
    return (
      <jeeves-user-settings>
        <Segment>
          <Header>Settings</Header>
          <Header>Billing</Header>
          <Header as='h3'>Current Plan</Header>
          <Card>
            <Card.Content>
              <Header as='h4'>Guest Pass</Header>
              <p>
                <span>Free</span><br />
                <strong>Renewal:</strong> <span>never</span>
              </p>
            </Card.Content>
          </Card>
        </Segment>
      </jeeves-user-settings>
    );
  }
};
