'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Card,
  Header,
  Icon,
  Segment
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

  handleKeyGenerated = (key) => {
    // TODO: Handle the generated key (e.g., store it securely, redirect to dashboard)
    console.log('Key generated:', key);
  };

  handleKeyImported = (key) => {
    // TODO: Handle the imported key (e.g., store it securely, redirect to dashboard)
    console.log('Key imported:', key);
  };

  render () {
    return (
      <sensemaker-front-page class='splash-page fade-in'>
        <HeaderBar showBrand={false} showButtons={false} />
        <section class='lead'>
          <Header as='h1' style={{ fontSize: '8em' }}>{BRAND_NAME}</Header>
          <p style={{ fontSize: '2em' }}>{BRAND_TAGLINE}</p>
          <p style={{ fontSize: '1.2em', marginBottom: '4em' }}>{PITCH_CTA_TEXT}</p>
          <Button.Group floated='right' size='huge'>
            <Button color='blue' as={Link} to='/sessions' icon labelPosition='left'><Icon name='user' />Log In</Button>
            <Button color='green' onClick={() => this.keyModal.handleOpen()} icon labelPosition='right'>Get Started<Icon name='right chevron' /></Button>
          </Button.Group>
        </section>
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
