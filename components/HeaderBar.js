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
  constructor (props) {
    super(props);

    this.state = {
      email: '',
      error: null,
      loading: false,
      joined: false,
      showBrand: true,
      showButtons: true
    };
  }

  render () {
    const { showBrand, showButtons } = this.props;
    return (
      <sensemaker-header-bar className='brand'>
        {(showBrand) && <Link to='/' style={{ float: 'left', fontWeight: 'bold', textTransform: 'uppercase' }}><Icon name='eye' size='big' style={{ verticalAlign: 'bottom' }} /> <span className='brand'>{BRAND_NAME}</span></Link>}
        {(showButtons) && (
          <Button.Group floated='right'>
            <Button as={Link} to='/sessions' color='green'><Icon name='key' /> Sign In</Button>
            <Button.Or />
            <Button as={Link} to='/inquiries' color='black'>Apply &raquo;</Button>
          </Button.Group>
        )}
        <br style={{ clear: 'both' }} />
      </sensemaker-header-bar>
    );
  }
}

module.exports = HeaderBar;
