'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Button,
  Modal
} = require('semantic-ui-react');

// Components
const TermsOfUse = require('./TermsOfUse');

class TermsOfUseModal extends React.Component {
  componentDidMount () {
    console.log('tou modal mounted');
    // $('.ui.modal').modal('show');
  }

  render () {
    return (
      <Modal defaultOpen={true}>
        <Modal.Header>Getting Started</Modal.Header>
        <Modal.Content>
          <p>Using Sensemaker requires agreeing to the Terms of Use ("the terms").  If you agree to the terms, click "I Agree" below.</p>
          <TermsOfUse {...this.props} auth={this.props.auth} />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={(e) => this.props.logout()}>Log Out</Button>
          <Button onClick={(e) => {
            this.props.signContract('terms-of-use', this.props.auth.token);
          }} positive>I Agree</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = TermsOfUseModal;
