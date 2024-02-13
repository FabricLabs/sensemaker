'use strict';

// Constants
const {
  BRAND_NAME,
  BRAND_TAGLINE,
  ENABLE_LOGIN,
  ENABLE_REGISTRATION
} = require('../constants');

// Strings
// TODO: use i18n (e.g., call i18n.t('pitch.cta.text') etc.)
const { PITCH_CTA_TEXT } = require('../locales/en');

// Dependencies
const React = require('react');
const { Link, Route, Routes, Switch } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Card,
  Header,
  Image,
  Label,
  Menu,
  Segment
} = require('semantic-ui-react');

// Components
const FrontPage = require('./FrontPage');
const LoginPage = require('./LoginPage');
const TermsOfUse = require('./TermsOfUse');
const Waitlist = require('./Waitlist');
const ResetPasswordForm = require('./ResetPasswordForm');
const SignUpForm = require('./SignUpForm');
const DeclinedInvitation = require('./DeclinedInvitation');

class Splash extends React.Component {
  render() {
    const { login, register, error, onLoginSuccess, onRegisterSuccess } = this.props;

    return (
      <jeeves-splash class="fade-in splash">
        <fabric-component class="ui primary action container">
          <Routes>
            <Route path="/" element={<FrontPage login={login} error={error} onLoginSuccess={onLoginSuccess} createInquiry={this.props.createInquiry} inquiries={this.props.inquiries}/>} />
            <Route path="/inquiries" element={<Waitlist login={login} error={error} onLoginSuccess={onLoginSuccess} createInquiry={this.props.createInquiry} inquiries={this.props.inquiries}/>} />
            <Route path="/sessions" element={<LoginPage login={login} error={error} onLoginSuccess={onLoginSuccess} />} />
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
        {/* This is not good, to take this route apart, but fabric component up there won't let me handle my SignUpForm width like i want,
        right now i made this route apart, probably splash component needs a rebuild later */}
        <section>
          <Routes>
            <Route path="/signup/:invitationToken"
              element={
                <SignUpForm
                  checkInvitationToken={this.props.checkInvitationToken}
                  checkUsernameAvailable={this.props.checkUsernameAvailable}
                  checkEmailAvailable={this.props.checkEmailAvailable}
                  auth={this.props.auth}
                  invitation={this.props.invitation}
                  fullRegister={this.props.fullRegister}
                  acceptInvitation={this.props.acceptInvitation}
                />}
            />
            <Route path="/signup/decline/:invitationToken"
              element={
                <DeclinedInvitation
                  checkInvitationToken={this.props.checkInvitationToken}
                  declineInvitation={this.props.declineInvitation}
                  invitation={this.props.invitation}
                />}
            />
          </Routes>
        </section>
        <section className='fade-in' style={{ clear: 'both', textAlign: 'center' }}>
          {ENABLE_LOGIN ? (<p style={{ marginTop: '2em' }}>Already have an account?  <Link to="/sessions">Log In &raquo;</Link></p>) : null}
          <p style={{ clear: 'both', marginTop: '4em', fontSize: '0.8em' }}>&copy; 2024 Legal Tools &amp; Technology, Inc.</p>
        </section>
        <script src="/scripts/countdown.js"></script>
      </jeeves-splash>
    );
  }
}

module.exports = Splash;
