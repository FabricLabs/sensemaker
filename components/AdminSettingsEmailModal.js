'use strict';

const React = require('react');

const {
  Button,
  Header,
  Form,
  Modal,
  Message,
  Label
} = require('semantic-ui-react');

class EmailEditModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      newEmail: '',
      isEmailValid: false,
      emailUpdated: false,
      emailUpdateError: '',
      emailModalLoading: false,
      emailError: ''
    };
  }

  componentDidUpdate(prevProps) {
    const { auth, stats } = this.props;

    if (prevProps.auth !== this.props.auth) {

      if (auth.emailAvailable && this.state.newEmail) {
        this.setState({ isEmailValid: true, emailError: '' });
      } else {
        this.setState({ isEmailValid: false, emailError: 'Email already registered, please choose a differnt one.' });
      }
    }

    if (this.state.emailModalLoading && prevProps.stats !== this.props.stats) {
      if (stats.emailEditSuccess) {
        this.setState({ emailModalLoading: false, emailUpdated: true });
        this.props.fetchUsers();
      } else {
        this.setState({ emailUpdateError: stats.error, emailUpdated: true });
      }
    }
  }

  emailModalOpen = () => {
    this.setState({
      newEmail: this.props.oldEmail,
      emailUpdated: false,
      emailUpdateError: '',
      emailModalLoading: false,
      emailError: ''
    });
  }
  emailModalClose = () => {
    this.props.toggleEmailModal();
    this.setState({
      newEmail: '',
      emailUpdated: false,
      emailUpdateError: '',
      emailModalLoading: false,
      emailError: ''
    });
  }


  // Handle input change
  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value }, () => {
      if (name === 'newEmail') {
        this.props.checkEmailAvailable(e.target.value);
      }
    });
  };

  // Handle form submission
  handleEmailSubmit = async () => {
    try {
      this.setState({
        emailModalLoading: true,
        emailUpdated: false,
        emailUpdateError: '',
      });
      //forced delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.props.editEmail(this.props.id, this.state.newEmail);
    } catch (error) {
      this.setState({ emailUpdateError: error.message, emailModalLoading: false });
    }
  };

  render() {

    const {
      newEmail,
      emailUpdated,
      emailUpdateError,
      emailModalLoading,
      emailError,
      isEmailValid
    } = this.state;

    const { open, oldEmail } = this.props;

    const emailMessageError = (isEmailValid || !newEmail || !emailError) ? null : {
      content: emailError,
      pointing: 'above',
    };

    return (
      <Modal
        open={open}
        onOpen={this.emailModalOpen}
        onClose={this.emailModalClose}
        size='tiny'
      >
        <Modal.Header>Add or Change Email</Modal.Header>
        <Modal.Content>
          <Header as='h4'> Actual Username: <Label>{emailUpdated ? newEmail : oldEmail}</Label></Header>
          <Form autoComplete="off" onSubmit={this.handleEmailSubmit}>
            <Form.Input
              label='New Email'
              name='newEmail'
              value={newEmail}
              error={emailMessageError}
              onChange={this.handleInputChange}
              required
              autoComplete="off"
              type='email'
            />
            <Modal.Actions>
              {emailUpdated && (
                <Message positive>
                  <Message.Header>Email updated</Message.Header>
                  <p>This username has been changed successfully.</p>
                </Message>
              )}
              {emailUpdateError && (
                <Message negative>
                  <Message.Header>Error updating mail</Message.Header>
                  <p>{emailUpdateError}</p>
                </Message>
              )}
              <Button.Group>
                <Button
                  content='Close'
                  icon='close'
                  size='small'
                  secondary
                  onClick={this.emailModalClose} />
                <Button
                  content='Submit'
                  icon='checkmark'
                  loading={emailModalLoading}
                  type='submit' size='small'
                  primary
                  disabled={!isEmailValid || !newEmail || newEmail === oldEmail}
                />
              </Button.Group>
            </Modal.Actions>
          </Form>
        </Modal.Content>
      </Modal>
    );
  };
}


module.exports = EmailEditModal;
