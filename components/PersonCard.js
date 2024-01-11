'use strict';

const {
  Card
} = require('semantic-ui-react');

class PersonCard extends Card {
  constructor (...settings) {
    super(...settings);

    this.settings = Object.assign({
      name: 'PersonCard'
    }, settings);

    return this;
  }

  render () {
    return (
      <Card>
        <Card.Content>
          <Card.Header>Matthew</Card.Header>
          <Card.Meta>Joined in 2015</Card.Meta>
          <Card.Description>Matthew is a musician living in Nashville.</Card.Description>
        </Card.Content>
      </Card>
    );
  }
}

module.exports = PersonCard;
