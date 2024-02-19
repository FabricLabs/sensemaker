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

class UsernameEditModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      newUsername: '',
      isNewUserValid: false,
      userUpdated: false,
      userUpdateError: '',
      userModalLoading: false,
      usernameError: ''
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.invitation !== this.props.invitation) {

      if (prevProps.auth !== this.props.auth) {
        const { auth } = this.props;
        if (auth.usernameAvailable && this.state.username) {
          this.setState({ isNewUserValid: true, usernameError: '' });
        } else {
          this.setState({ isNewUserValid: false, usernameError: 'Username already exists. Please choose a different one.' });
        }
      }
    };
    if(userModalLoading && prevProps.stats !== this.props.stats){
      if(this.props.stats.userEditSuccess){
        this.setState({userModalLoading: false, userUpdated: true})
      }else{
        this.setState({userUpdateError: this.props.stats.error, userUpdated: true})
      }
    }
  }

  userModalOpen = () => {
    this.setState({
      newUsername: '',
      isNewUserValid: false,
      userUpdated: false,
      userUpdateError: '',
      userModalLoading: false,
      usernameError: ''
    });
  }
  userModalClose = () => {
    this.props.toggleUserModal();
    this.setState({
      newUsername: '',
      isNewUserValid: false,
      userUpdated: false,
      userUpdateError: '',
      userModalLoading: false,
      usernameError: ''
    });
  }


  // Handle input change
  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
    if (name === 'newUsername') {
      // Check for special characters and whitespace
      if ((/[^a-zA-Z0-9]/.test(value))) {
        this.setState({
          isNewUserValid: false,
          usernameError: 'Username must not contain special characters or spaces.',
        });
      } else {
        if (value.length < 3) {
          this.setState({
            isNewUserValid: false,
            usernameError: 'Username must have at least 3 characters.',
          });
        } else {
          if (value === this.props.oldUsername) {
            this.setState({
              isNewUserValid: false,
              usernameError: 'The new username must be different to the actual one',
            });
          } else {
            this.props.checkUsernameAvailable(value);
          }
        }
      }
    }
  };

  // Handle form submission
  handleUserSubmit = async () => {
    const { isNewUserValid } = this.state;
    if (isNewUserValid) {
      try {
        //these are the different states to show different messages according to the update username api answers
        this.setState({
          userModalLoading: true,
          userUpdated: false,
          userUpdateError: '',
        });
        this.props.editUsername(this.props.id,this.state.newUsername);
      } catch (error) {
        this.setState({ userUpdateError: error.message, userModalLoading: false });
      }
    }
  };

  render() {

    const {
      newUsername,
      isNewUserValid,
      userUpdated,
      userUpdateError,
      userModalLoading,
      usernameError,
    } = this.state;

    const { open, oldUsername } = this.props;

    // const passwordInputStyle = isNewPasswordValid ? { borderColor: 'green' } : { borderColor: 'red' };
    const userError = (isNewUserValid || !newUsername) ? null : {
      content: usernameError,
      pointing: 'above',
    };

    return (
      <Modal
        open={open}
        onOpen={this.userModalOpen}
        onClose={this.userModalClose}
        size='tiny'
      >
        <Modal.Header>Change Username</Modal.Header>
        <Modal.Content>
          <Header as='h4'> Actual Username: <Label>{oldUsername}</Label></Header>
          <Form onSubmit={this.handleUserSubmit}>
            <Form.Input
              label='New Username'
              name='newUsername'
              value={newUsername}
              error={userError}
              onChange={this.handleInputChange}
              required
              autocomplete="off"
            />
            <Modal.Actions>
              {userUpdated && (
                <Message positive>
                  <Message.Header>Username updated</Message.Header>
                  <p>This username has been changed successfully.</p>
                </Message>
              )}
              {userUpdateError && (
                <Message negative>
                  <Message.Header>Internal server error</Message.Header>
                  <p>Please try again later.</p>
                </Message>
              )}
              <Button
                content='Close'
                icon='close'
                size='small'
                secondary
                onClick={this.userModalClose} />
              <Button
                content='Submit'
                icon='checkmark'
                loading={userModalLoading}
                type='submit' size='small'
                primary
                disabled={!isNewUserValid} />
            </Modal.Actions>
          </Form>
        </Modal.Content>
      </Modal>
    );
  };
}


module.exports = UsernameEditModal;
