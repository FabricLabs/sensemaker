'use strict';

// Dependencies
const React = require('react');
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
      const results = await Promise.all([
        new Promise((resolve, reject) => {
          setTimeout(resolve, 1500);
        }),
        fetch('/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })
      ]);

      console.log('results:', results);
      const response = results[1];

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      this.setState({
        error: null,
        loading: false,
        joined: true
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };

  resetForm = (event) => {
    event.preventDefault();
    this.setState({
      email: '',
      joined: false
    });
  }

  render() {
    const { email, error, joined } = this.state;

    return (
      <fabric-react-component class="ui primary action fluid container">
        <Card>
          <Card.Content>
            {joined ? (
              <div className="fade-in">
                <Header as="h3">You're on the list!</Header>
                <p>Thanks for your interest!  We'll notify you as soon as Jeeves is available.</p>
                <Button fluid onClick={this.resetForm} className='left labeled icon'><Icon name='left chevron' /> Back</Button>
              </div>
            ) : (
              <div className="fade-in">
                <Header>Join the Waitlist!</Header>
                <p>Jeeves is a purpose-built <strong>Artificial Intelligence (AI)</strong> trained on <strong>real-world case law</strong> under <strong>supervision by licensed attorneys</strong>.</p>
                <p>Be among the first to try Jeeves:</p>
                <Form onSubmit={this.handleSubmit}>
                  <Form.Field>
                    <label>Email Address</label>
                    <Input required placeholder="Your email address" name="email" value={email} onChange={this.handleChange} />
                  </Form.Field>
                  <div>
                    <Button fluid color='green' loading={this.state.loading} type="submit" className='right labeled icon'>Add Me To The Waitlist <Icon name='right chevron' /></Button>
                    {error && <Message error visible content={error} className="fade-in" />}
                  </div>
                </Form>
              </div>
            )}
          </Card.Content>
        </Card>
      </fabric-react-component>
    );
  }
}

module.exports = Waitlist;
