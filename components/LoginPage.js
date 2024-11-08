'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Card,
  Grid
} = require('semantic-ui-react');

const HeaderBar = require('./HeaderBar');
const LoginForm = require('./LoginForm');

class LoginPage extends React.Component {
  render () {
    const { login, error, onLoginSuccess } = this.props;

    return (
      <sensemaker-login-page class="fade-in">
        <fabric-component class="ui primary action fluid container">
          <HeaderBar showBrand={false} showButtons={false} />
          <Grid centered width="100%">
            <Grid.Column mobile={16} tablet={8} computer={8}>
              <Card fluid>
                <Card.Content>
                  <Card.Header as="h2">Log In</Card.Header>
                  <LoginForm {...this.props} login={login} error={error} onLoginSuccess={onLoginSuccess} />
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid>
        </fabric-component>
      </sensemaker-login-page>
    );
  }
}

module.exports = LoginPage;
