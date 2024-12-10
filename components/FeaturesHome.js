'use strict';

const React = require('react');

const {
  Header,
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
        <HeaderBar showBrand={true} showButtons={true} />
        <Segment style={{ clear: 'both' }}>
          <Header as='h1'>Features</Header>
          <p style={{ fontSize: '2em', width: '320px' }}></p>
          <p style={{ fontSize: '1.2em', marginBottom: '2em' }}></p>
          <section>
            <Header as='h2'>Local Intelligence</Header>
            <p>Keep your data local, manage your costs, and ensure reliability with Sensemaker's offline-first design.</p>
          </section>
          <section>
            <Header as='h2'>Network Analysis</Header>
            <p>Consume data streams from a variety of sources, including a robust peer-to-peer network of other users.</p>
          </section>
          <section>
            <Header as='h2'>Earn for Insights</Header>
            <p>Get rewarded for valuable contributions to the network.</p>
          </section>
        </Segment>
      </sensemaker-features-home>
    );
  }

  toHTML () {
    
  }
}

module.exports = FeaturesHome;
