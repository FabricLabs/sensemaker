'use strict';

const {
  Card
} = require('semantic-ui-react');

class CaseCard extends Card {
  constructor (...settings) {
    super(...settings);

    this.settings = Object.assign({
      name: 'CaseCard'
    }, settings);

    return this;
  }

  render () {
    return (
      <Card>
        <Card.Content>
          <Card.Header>X v. Y</Card.Header>
          <Card.Meta>2023</Card.Meta>
          <Card.Description></Card.Description>
        </Card.Content>
      </Card>
    );
  }
}

module.exports = CaseCard;
