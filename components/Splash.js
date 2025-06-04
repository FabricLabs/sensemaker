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
const { Link, Navigate, Route, Routes, Switch } = require('react-router-dom');

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
const AccountCreator = require('./AccountCreator');
const FeaturesHome = require('./FeaturesHome');
const FrontPage = require('./FrontPage');
const ResetPasswordForm = require('./ResetPasswordForm');
const SignUpForm = require('./SignUpForm');
const DeclinedInvitation = require('./DeclinedInvitation');
const InvitationView = require('./InvitationView');

/**
 * Home page for visitors (not yet logged in).
 */
class Splash extends React.Component {
  render () {
    const { auth, login, register, error, onLoginSuccess, onRegisterSuccess } = this.props;
    return (
      <sensemaker-splash class='fade-in splash'>
        <fabric-component class='ui primary action fluid container'>

        </fabric-component>
        <section style={{ display: 'flex', justifyContent: 'center' }}>
          <Routes>
            {/* TODO: fix these routes */}
            <Route path='/services/passwords/:resetToken' element={<ResetPasswordForm />} />
            <Route path='/invitations/:id' element={<InvitationView />} />
            <Route path='/services/invitations/:invitationToken'
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
            <Route path='/services/invitations/decline/:invitationToken'
              element={
                <DeclinedInvitation
                  checkInvitationToken={this.props.checkInvitationToken}
                  declineInvitation={this.props.declineInvitation}
                  invitation={this.props.invitation}
                />}
            />
          </Routes>
        </section>
      </sensemaker-splash>
    );
  }
}

module.exports = Splash;
