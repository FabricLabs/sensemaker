'use strict';

const React = require('react');

const {
  Header
} = require('semantic-ui-react');

module.exports = class JeevesUserSettings extends React.Component {
  render () {
    return (
      <jeeves-user-settings>
        <Header>Settings</Header>
        <Header>Billing</Header>
      </jeeves-user-settings>
    );
  }
};
