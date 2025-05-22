'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Card,
  Container,
  Grid,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

const HeaderBar = require('./HeaderBar');

class FeaturesHome extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <sensemaker-features-home>
        <Container>
          <HeaderBar showBrand={false} showButtons={true} />
          <Header>What is Sensemaker?</Header>
          <p>Sensemaker is a powerful artificial intelligence platform.</p>
        </Container>
      </sensemaker-features-home>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = FeaturesHome;
