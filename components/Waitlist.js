'use strict';

const {
  BRAND_NAME,
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
  Input,
  Message
} = require('semantic-ui-react');

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

  render() {
    const { email, error, joined } = this.state;

    return (
      <Card fluid style={{ textAlign: 'left' }}>
        <Card.Content>
          {joined ? (
            <div className="fade-in">
              <Header as="h3">You're on the list!</Header>
              <p>Thanks for your interest!  We'll notify you as soon as {BRAND_NAME} is available.</p>
              <Button fluid onClick={this.resetForm} className='left labeled icon'><Icon name='left chevron' /> Back</Button>
              {/* Google Analytics - Conversion Event */}
              <script>
                gtag('event', 'manual_event_SUBMIT_LEAD_FORM', {
                  // <event_parameters>
                });
              </script>
            </div>
          ) : (
            <div className="fade-in">
              <Header>Join the Waitlist!</Header>
              <Form onSubmit={this.handleSubmit}>
                <Form.Field>
                  <p style={{ marginBottom: '2em' }}>Be among the first to try {BRAND_NAME} by joining the waitlist.  Enter your email to be notified when we launch!</p>
                  <Input required placeholder="Your email address" name="email" value={email} onChange={this.handleChange} type='email' />
                </Form.Field>
                <div>
                  <Button fluid color='green' loading={this.state.loading} type="submit" className='right labeled icon'>Join the Waitlist <Icon name='right chevron' /></Button>
                  {error && <Message error visible content={error} className="fade-in" />}
                  {/* <Button fluid color='blue' onClick={this.revealLoginForm}>I already have a login</Button> */}
                </div>
              </Form>
            </div>
          )}
        </Card.Content>
      </Card>
    );
  }
}

module.exports = Waitlist;
