'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Button,
  Form,
  Message
} = require('semantic-ui-react');

class LoginForm extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      loading: false,
      username: '',
      password: '',
    };
  }

  componentDidUpdate (prevProps) {
    // If a new login request has been initiated or an error has occurred, stop loading
    if ((this.props.error === null && prevProps.error !== null) || (this.props.error && prevProps.error !== this.props.error)) {
      this.setState({ loading: false });
    }
  }

  handleUsernameChange = (event) => {
    console.log('username change:', event.target.value);
    this.setState({ username: event.target.value });
  };

  handlePasswordChange = (event) => {
    console.log('password change:', '(' + event.target.value.length + ' chars)');
    this.setState({ password: event.target.value });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { username, password } = this.state;

    this.setState({ loading: true });

    // Call login action creator
    this.props.login(username, password);
  };

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  render () {
    const { username, password, loading } = this.state;
    const { error } = this.props;

    return (
      <fabric-react-component class="ui primary action fluid text container">
        <Form onSubmit={this.handleSubmit} size={this.props.size} method="POST">
          <Form.Field>
            <label>Username</label>
            <input placeholder="Username" name="username" autoComplete="username" value={username} onChange={this.handleUsernameChange} />
          </Form.Field>
          <Form.Field>
            <label>Password</label>
            <input type="password" autoComplete="current-password" placeholder="Password" name="password" value={password} onChange={this.handlePasswordChange} />
          </Form.Field>
          <div>
            <Button floated='right' fluid primary loading={loading} type="submit" size={this.props.size}>Login</Button>
            {error && <Message error visible content={error} style={{clear: 'both'}} />} {/* Display error message if error state is not null */}
          </div>
        </Form>
      </fabric-react-component>
    );
  }
}

module.exports = LoginForm;
