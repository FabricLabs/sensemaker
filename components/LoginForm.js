'use strict';

// Dependencies
const React = require('react');
const { connect } = require('react-redux');

// Semantic UI
const {
  Button,
  Form,
  Input
} = require('semantic-ui-react');

class JeevesLoginForm extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      loading: false,
      username: '',
      password: '',
    };
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleSubmit = () => {
    this.setState({ loading: true });

    setTimeout(() => {
      this.props.onLoginSuccess(this.state.username, this.state.password);
      this.setState({ loading: false });
    }, 1000);
  };

  render () {
    return (
      <fabric-react-component class="ui primary action fluid text container">
        <Form onSubmit={this.handleSubmit} size={this.props.size}>
          <Form.Field>
            <label>Username</label>
            <input placeholder="Username" name="username" autocomplete="username" value={this.state.username} onChange={this.handleInputChange} />
          </Form.Field>
          <Form.Field>
            <label>Password</label>
            <input type="password" autocomplete="current-password" placeholder="Password" name="password" value={this.state.password} onChange={this.handleInputChange} />
          </Form.Field>
          <Button floated='right' fluid primary loading={this.state.loading} type="submit" size={this.props.size}>Login</Button>
        </Form>
      </fabric-react-component>
    );
  }
}

module.exports = JeevesLoginForm;
