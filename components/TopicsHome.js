'use strict';

// Dependencies
const React = require('react');
const { Header, Icon, Segment } = require('semantic-ui-react');

class TopicsHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      messages: [],
      showKeyringManager: false
    };
  }

  render () {
    return (
      <Segment>
        <Header as='h2' icon textAlign='center'>
          <Icon name='chat' circular />
          <Header.Content>Topics</Header.Content>
        </Header>
        <p>Welcome to the Topics Home!</p>
        <p>Here you can find various topics and discussions.</p>
      </Segment>
    );
  }
}

module.exports = TopicsHome;
