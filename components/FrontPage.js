'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Container,
  Header,
  Icon
} = require('semantic-ui-react');

// Local Components
const HeaderBar = require('./HeaderBar');
const KeyManagementModal = require('./KeyManagementModal');

// Strings
// TODO: use i18n (e.g., call i18n.t('pitch.cta.text') etc.)
const {
  BRAND_NAME,
  BRAND_TAGLINE,
  PITCH_CTA_TEXT
} = require('../locales/en');

class FrontPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      error: null,
      loading: false,
      joined: false
    };

    return this;
  }

  render () {
    return (
      <sensemaker-front-page class='splash-page fade-in'>
        <HeaderBar showBrand={false} showButtons={false} />
        <Container text style={{ marginTop: '4em', marginBottom: '4em' }}>
          <section className='lead' style={{ textAlign: 'center' }}>
            <Header as='h1' style={{ fontSize: '8em', marginBottom: '0.2em' }}>{BRAND_NAME}</Header>
            <p style={{ fontSize: '2em', marginBottom: '1em' }}>{BRAND_TAGLINE}</p>
            <p style={{ fontSize: '1.2em', marginBottom: '4em', color: 'rgba(0,0,0,0.6)' }}>{PITCH_CTA_TEXT}</p>
            <Button.Group size='huge'>
              <Button color='blue' as={Link} to='/sessions' icon labelPosition='left'><Icon name='user' />Log In</Button>
              <Button color='green' as={Link} to='/features' icon labelPosition='right'>Learn More<Icon name='right chevron' /></Button>
            </Button.Group>
          </section>
        </Container>
        <KeyManagementModal
          ref={(ref) => this.keyModal = ref}
          onKeyGenerated={this.handleKeyGenerated}
          onKeyImported={this.handleKeyImported}
        />
      </sensemaker-front-page>
    );
  }
}

module.exports = FrontPage;
