'use strict';

const React = require('react');
const { Link } = require('react-router-dom');
const {
  Button,
  Container,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

class NotFound extends React.Component {
  render () {
    return (
      <Container text style={{ marginTop: '7em', textAlign: 'center' }}>
        <Segment padded='very' basic>
          <Header as='h1' icon>
            <Icon name='compass outline' />
            404: Page Not Found
            <Header.Subheader>
              Oops!  The page you're looking for doesn't exist.
            </Header.Subheader>
          </Header>
          <p style={{ fontSize: '1.2em', color: 'rgba(0,0,0,0.6)', margin: '2em 0' }}>
            We couldn't find what you were looking for.  Let's get you back on track.
          </p>
          <Button
            as={Link}
            to='/'
            primary
            size='large'
            icon
            labelPosition='left'
          >
            <Icon name='home' />
            Return Home
          </Button>
        </Segment>
      </Container>
    );
  }
}

module.exports = NotFound;
