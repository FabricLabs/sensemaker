'use strict';

const {
  BRAND_NAME,
  BRAND_TAGLINE,
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
const { PITCH_CTA_TEXT } = require('../locales/en');

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
      <div>
        <div>
          <Link to='/'><Image src="/images/novo-logo.svg" size='large' style={{ margin: '0 1em 2em 1em', maxHeight: '2em' }} /></Link>
          <Button.Group floated='right'>
            <Button as={Link} to='/sessions'>Sign In</Button>
            <Button as={Link} to='/inquiries' primary>Try Now</Button>
          </Button.Group>
        </div>
        <section>
          <Image src="/images/favicon.svg" size='large' style={{ float: 'right', maxHeight: '20em' }} />
          <Header as='h1' style={{ fontSize: '15em', marginBottom: '0.5em' }}>{BRAND_NAME} <small><Label>beta</Label></small></Header>
          <p>{BRAND_TAGLINE}</p>
          <p style={{ fontSize: '1.5em', marginBottom: '1em' }}>{PITCH_CTA_TEXT}</p>
          <novo-splash-cta>
            <Button>Try Now</Button>
          </novo-splash-cta>
        </section>
      </div>
    );
  }
}

module.exports = Waitlist;
