'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Header,
  Image,
  Label
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
          {/* <LoginForm login={login} error={error} onLoginSuccess={onLoginSuccess} size='large' /> */}
          <Waitlist />
        </fabric-card-content>
      </jeeves-splash>
    );
  }
}

module.exports = Splash;
