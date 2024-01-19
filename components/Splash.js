'use strict';

// Constants
const {
  ENABLE_LOGIN,
  ENABLE_REGISTRATION
} = require('../constants');

// Dependencies
const React = require('react');
const { Link, Route, Routes, Switch } = require('react-router-dom');

// Semantic UI
const {
  Card,
  Header,
  Image
} = require('semantic-ui-react');

// Components
const AccountCreator = require('./AccountCreator');
const LoginPage = require('./LoginPage');
const TermsOfUse = require('./TermsOfUse');
const Waitlist = require('./Waitlist');
const ResetPasswordForm = require('./ResetPasswordForm');
const SingUpForm = require('./SingUpForm');

class Splash extends React.Component {
  render () {
    const { login, register, error, onLoginSuccess, onRegisterSuccess } = this.props;

    return (
      <jeeves-splash class="fade-in splash">

          <Image src="/images/novo-logo.svg" size='small' centered />
          {/* <div style={{textAlign: 'center'}}>
            <Header>JEEVES</Header>
          </div> */}

        <fabric-component class="ui primary action container">
          <Routes>
            <Route path="/" element={<Waitlist login={login} error={error} onLoginSuccess={onLoginSuccess} />} />
            <Route path="/sessions/new" element={<LoginPage login={login} error={error} onLoginSuccess={onLoginSuccess} />} />
            <Route path="/contracts/terms-of-use" element={<TermsOfUse onAgreeSuccess={onLoginSuccess} fetchContract={this.props.fetchContract} />} />
            <Route path="/passwordreset/:resetToken" element={<ResetPasswordForm />} />
          </Routes>
          {/* ENABLE_REGISTRATION ? (
            <Card>
              <Card.Content>
                <Header as='h3'>Register</Header>
                <AccountCreator register={register} error={error} onRegisterSuccess={onRegisterSuccess} size='large' />
              </Card.Content>
            </Card>
          ) : null */}
        </fabric-component>
        <section>
          <Routes>
            <Route path="/singup/:invitationToken"
              element={
                <SingUpForm
                  checkInvitationToken={this.props.checkInvitationToken}
                  invitation={this.props.invitation}
                />} />
          </Routes>
        </section>
        <section className='fade-in' style={{ clear: 'both', textAlign: 'center' }}>
          {ENABLE_LOGIN ? (<p style={{ marginTop: '2em' }}>Already have an account?  <Link to="/sessions/new">Log In &raquo;</Link></p>) : null}
          <p style={{ clear: 'both', marginTop: '4em', fontSize: '0.8em' }}>&copy; 2023 Legal Tools &amp; Technology, Inc.</p>
        </section>
      </jeeves-splash>
    );
  }
}

module.exports = Splash;
