'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Icon,
  Header
} = require('semantic-ui-react');

// Local Components
const HeaderBar = require('./HeaderBar');

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
      <sensemaker-front-page class='splash-page'>
        <HeaderBar showBrand={false} showButtons={true} />
        <section>
          <Header as='h1' style={{ fontSize: '8em' }}>{BRAND_NAME}</Header>
          <p style={{ fontSize: '2em', width: '320px' }}>{BRAND_TAGLINE}</p>
          <p style={{ fontSize: '1.2em', marginBottom: '1em' }}>{PITCH_CTA_TEXT}</p>
          <Button as={Link} to='/sessions' color='black' size='huge' labelPosition='right' icon>Get Started <Icon name='right chevron' /></Button>
        </section>
        <secton>
          <Header as='h2'>Local Intelligence</Header>
          <p>Keep your data local, manage your costs, and ensure reliability with Sensemaker's offline-first design.</p>
        </secton>
      </sensemaker-front-page>
    );
  }
}

module.exports = FrontPage;
