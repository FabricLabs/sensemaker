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
  Divider,
  Form,
  Button,
  Grid,
  Icon,
  Header,
  Input,
  Image,
  Message
} = require('semantic-ui-react');

const HeaderBar = require('./HeaderBar');

class InquiriesHome extends React.Component {
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

  componentDidUpdate (prevProps) {
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
      <sensemaker-inquiries>
        <fabric-component className="ui primary action fluid container">
          <HeaderBar showBrand={false} showButtons={false} />
          <Grid centered width='100%' style={{ marginTop: '2em' }}>
            <Grid.Column mobile={16} tablet={8} computer={8}>
              <Card fluid style={{ textAlign: 'left' }}>
                <Card.Content>
                  {joined ? (
                    <div className="fade-in">
                      <Header as="h3">You're on the list!</Header>
                      <p>Thanks for your interest!  We'll notify you as soon as {BRAND_NAME} is available.</p>
                      <Button fluid as={Link} to='/' className='left labeled icon' color='black'><Icon name='left chevron' /> Return Home</Button>
                    </div>
                  ) : (
                    <div className="fade-in">
                      <Header>Join the Waitlist!</Header>
                      <Form onSubmit={this.handleSubmit}>
                        {error && <Message error visible content={error} className="fade-in" />}
                        <Form.Field>
                          <p>{BRAND_NAME} is currently closed to the public.</p>
                          <Input required placeholder="Your email address" name="email" value={email} onChange={this.handleChange} type='email' />
                        </Form.Field>
                        <div>
                          <Button fluid color='green' loading={this.state.loading} type="submit" className='right labeled icon'>Join the Waitlist <Icon name='right chevron' /></Button>
                          <p style={{ marginTop: '1em' }}>Already have an account?  <Link to='/sessions'>Sign In &raquo;</Link></p>
                          <Divider />
                          <Button as={Link} to='/' fluid icon labelPosition='left' size='small' color='black'><Icon name='left chevron' />Return Home</Button>
                        </div>
                      </Form>
                    </div>
                  )}
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid>
        </fabric-component>
      </sensemaker-inquiries>
    );
  }
}

module.exports = InquiriesHome;
