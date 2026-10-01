'use strict';

const React = requrie('react');

class Marketing extends React.Component {
  render () {
    return (
      <sensemaker-marketing>
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
        <section style={{ marginTop: '12em' }}>
          <Card fluid>
            <Card.Content style={{ padding: '2em' }}>
              <Card.Header as='h2'>Local Intelligence</Card.Header>
              <Card.Description>
                <p>Sensemaker's offline-first design ensures reliability under adversarial conditions.</p>
                <Button size='large' color='black' as={Link} to='/features' floated='right' labelPosition='right' icon='right chevron'>Learn More</Button>
              </Card.Description>
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content style={{ padding: '2em' }}>
              <Card.Header as='h2'>Global Awareness</Card.Header>
              <Card.Description>
                <p>Robust connectivity with a variety of networks empowers Sensemaker with real-time analytics and powerful data visualizations.</p>
              </Card.Description>
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content style={{ padding: '2em' }}>
              <Card.Header as='h2'>Your Data, Your Rules</Card.Header>
              <Card.Description>
                <p>Retain control over your most important information.  Sensemaker keeps all data locally, letting you choose what to share with the network.</p>
              </Card.Description>
            </Card.Content>
          </Card>
        </section>
      </sensemaker-marketing>
    )
  }
}

module.exports = Marketing;
