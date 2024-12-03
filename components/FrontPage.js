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
      <sensemaker-front-page class='splash-page fade-in'>
        <HeaderBar showBrand={false} showButtons={false} />
        <section>
          <Header as='h1' style={{ fontSize: '8em' }}>{BRAND_NAME}</Header>
          <p style={{ fontSize: '2em', width: '320px' }}>{BRAND_TAGLINE}</p>
          <p style={{ fontSize: '1.2em', marginBottom: '2em' }}>{PITCH_CTA_TEXT}</p>
          <Button.Group floated='right' size='huge'>
            <Button as={Link} to='/sessions' color='green'><Icon name='key' /> Sign In</Button>
            <Button.Or />
            <Button as={Link} to='/inquiries' color='black'>Apply <Icon name='right chevron' /></Button>
          </Button.Group>
        </section>
      </sensemaker-front-page>
    );
  }
}

module.exports = FrontPage;
