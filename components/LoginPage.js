'use strict';

const React = require('react');
const { Link, Route, Routes, Switch } = require('react-router-dom');

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

const LoginForm = require('./LoginForm');
const AccountCreator = require('./AccountCreator');

class LoginPage extends React.Component {
  render () {
    const { login, register, error, onLoginSuccess, onRegisterSuccess } = this.props;

    return (
      <jeeves-login-page class="fade-in">
          <Card fluid>
            <Card.Content>
              <Card.Header as='h2'>Log In</Card.Header>
              <LoginForm {...this.props} login={login} error={error} onLoginSuccess={onLoginSuccess} />
            </Card.Content>
          </Card>
      </jeeves-login-page>
    );
  }
}

module.exports = LoginPage;
