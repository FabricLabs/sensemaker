'use strict';

const LOGIN_ENABLED = false;

// Dependencies
const React = require('react');

// Semantic UI
const {
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
      <jeeves-splash>
        <fabric-card-content>
          <Image src="/images/jeeves-brand.png" size='small' centered />
          <div style={{textAlign: 'center'}}>
            <Header>JEEVES</Header>
          </div>
        </fabric-card-content>
        <fabric-card-content>
          <Waitlist />
          {LOGIN_ENABLED ? (
            <LoginForm login={login} error={error} onLoginSuccess={onLoginSuccess} size='large' />
          ) : null}
        </fabric-card-content>
        <fabric-card-content>
          <p style={{ fontSize: '0.8em', textAlign: 'center', marginTop: '4em' }}>&copy; 2023 Legal Tools &amp; Technology, Inc.</p>
        </fabric-card-content>
      </jeeves-splash>
    );
  }
}

module.exports = Splash;
