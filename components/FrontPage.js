'use strict';

const {
  ENABLE_LOGIN
} = require('../constants');

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');
const $ = require('jquery');

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

class Waitlist extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      error: null,
      loading: false,
      joined: false
    };
  }

  componentDidMount = () => {
    $('input[name=email]').focus();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.inquiries !== this.props.inquiries) {
      const { inquiries } = this.props;

      if (this.state.loading && !inquiries.creating) {
        if (inquiries.createdSuccess) {

          this.setState({
            error: null,
            loading: false,
            joined: true
          });
        } else {
          this.setState({
            error: inquiries.error,
            loading: false
          });
        }
      }
    }
  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };

  handleSubmit = async (event) => {
    event.preventDefault();

    this.setState({
      error: null,
      loading: true
    });

    const { email } = this.state;


    try {
      await this.props.createInquiry(email);
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };

  resetForm = (event) => {
    event.preventDefault();
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({
        email: '',
        joined: false,
        loading: false
      });
    }, 375);
  }

  revealLoginForm = (event) => {
    event.preventDefault();
    $('#login-form').slideDown();
  }

  render () {
    const { email, error, joined } = this.state;

    return (
      <div style={{ width: '500px' }}>
        <div>
          <Link to='/' style={{ float: 'left' }}><Image src="/images/novo-logo.svg" style={{ margin: '0 1em 2em 1em', height: '2em' }} /></Link>
          <Button.Group floated='right'>
            <Button as={Link} to='/sessions'>Sign In</Button>
            <Button as={Link} to='/inquiries' primary>Try Now</Button>
          </Button.Group>
          <br style={{ clear: 'both' }} />
        </div>
        <section>
          <Image src="/images/favicon.svg" style={{ float: 'right', height: '10em' }} />
          <Header as='h1' style={{ fontSize: '7em', marginBottom: '0.5em' }}>{BRAND_NAME} <Label circular size='big' color='blue' style={{ position: 'relative', left: '-30px', verticalAlign: 'baseline' }}>beta</Label></Header>
          <p style={{ fontSize: '2em', width: '320px' }}>{BRAND_TAGLINE}</p>
          <p style={{ fontSize: '1.2em', marginBottom: '1em' }}>{PITCH_CTA_TEXT}</p>
          <Button primary size='huge' labelPosition='right'>Try Now <Icon name='right chevron' /></Button>
        </section>
      </div>
    );
  }
}

module.exports = Waitlist;
