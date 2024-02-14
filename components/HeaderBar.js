'use strict';

const {
  ENABLE_LOGIN
} = require('../constants');

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Card,
  Form,
  Button,
  Icon,
  Header,
  Image,
  Input,
  Label,
  Message
} = require('semantic-ui-react');

// Strings
// TODO: use i18n (e.g., call i18n.t('pitch.cta.text') etc.)
const {
  BRAND_NAME,
  BRAND_TAGLINE,
  PITCH_CTA_TEXT
} = require('../locales/en');

class HeaderBar extends React.Component {
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
        <Link to='/' style={{ float: 'left' }}><Image src="/images/novo-logo.svg" style={{ margin: '0 1em 2em 1em', height: '2em' }} /></Link>
        <Button.Group floated='right'>
          <Button as={Link} to='/sessions'>Sign In</Button>
          <Button as={Link} to='/inquiries' primary>Try Now</Button>
        </Button.Group>
        <br style={{ clear: 'both' }} />
      </div>
    );
  }
}

module.exports = HeaderBar;
