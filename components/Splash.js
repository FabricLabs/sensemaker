'use strict';

// Dependencies
const React = require('react');
const { connect } = require('react-redux');

// Semantic UI
const {
  Button,
  Header,
  Image,
  Label
} = require('semantic-ui-react');

// Components
const LoginForm = require('./LoginForm');

class JeevesSplash extends React.Component {
  render () {
    return (
      <jeeves-splash>
        <fabric-card-content>
          <Image src="/images/jeeves-brand.png" size='medium' centered />
          <div style={{textAlign: 'center'}}>
            <Header>JEEVES</Header>
            <Label><code>alpha</code></Label>
          </div>
        </fabric-card-content>
        <fabric-card-content>
          <LoginForm onLoginSuccess={this.props.onLoginSuccess} size='large' />
        </fabric-card-content>
      </jeeves-splash>
    );
  }
}

module.exports = JeevesSplash;
