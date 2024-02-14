'use strict';

const {
  ENABLE_LOGIN
} = require('../constants');

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Icon,
  Header,
  Image,
  Label
} = require('semantic-ui-react');

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
  }

  render () {
    return (
      <div>
        <HeaderBar />
        <section>
          <Image src="/images/favicon.svg" style={{ float: 'right', height: '17em', transform: 'scaleX(-1)' }} className='desktop-only' />
          <Header as='h1' style={{ fontSize: '10em' }}>{BRAND_NAME} <Label circular size='big' color='blue' style={{ position: 'relative', left: '-30px', verticalAlign: 'baseline' }}>beta</Label></Header>
          <p style={{ fontSize: '2em', width: '320px' }}>{BRAND_TAGLINE}</p>
          <p style={{ fontSize: '1.2em', marginBottom: '1em' }}>{PITCH_CTA_TEXT}</p>
          <Button as={Link} to='/inquiries' primary size='huge' labelPosition='right' icon>Try Now <Icon name='right chevron' /></Button>
        </section>
      </div>
    );
  }
}

module.exports = FrontPage;
