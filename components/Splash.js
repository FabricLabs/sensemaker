'use strict';

const LOGIN_ENABLED = false;

// Dependencies
const React = require('react');

// Semantic UI
const {
  Card,
  Header,
  Image,
  Label,
  Footer
} = require('semantic-ui-react');

// Components
const LoginForm = require('./LoginForm');
const Waitlist = require('./Waitlist');

class Splash extends React.Component {
  render () {
    const { login, error, onLoginSuccess } = this.props;

    return (
      <jeeves-splash class="fade-in">
        <fabric-component>
          <Image src="/images/jeeves-brand.png" size='small' centered />
          <div style={{textAlign: 'center'}}>
            <Header>JEEVES</Header>
          </div>
        </fabric-component>
        <fabric-component class="ui primary action fluid container">
          {LOGIN_ENABLED ? (
            <Card>
              <Card.Content>
                <Header as='h3'>Sign In</Header>
                <p>Provide your username and password.</p>
                <LoginForm login={login} error={error} onLoginSuccess={onLoginSuccess} size='large' />
              </Card.Content>
            </Card>
          ) : (
            <Waitlist login={login} error={error} onLoginSuccess={onLoginSuccess} />
          )}
        </fabric-component>
        <fabric-component class='fade-in' style={{ clear: 'both' }}>
          <p style={{ fontSize: '0.8em', textAlign: 'center', marginTop: '4em', clear: 'both' }}>&copy; 2023 Legal Tools &amp; Technology, Inc.</p>
        </fabric-component>
      </jeeves-splash>
    );
  }
}

module.exports = Splash;
