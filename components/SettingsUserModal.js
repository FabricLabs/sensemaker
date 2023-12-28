'use strict';

const React = require('react');

const {
  Button,
  Header,
  Segment,
  Table,
  Form,
  Modal,
  Message,
  Label
} = require('semantic-ui-react');

class UserChangeModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      newUsername: '',
      isNewUserValid: false,     
      usernameExists: false, //state to check if the new username already exists
      userUpdated: false, 
      userUpdateError: false,
      userModalLoading: false,
      password: '',
      invalidPassword: false,
      usernameError: ''
    };
  }

  userModalOpen = () => {
    this.setState({
      newUsername: '',
      isNewUserValid: false,      
      usernameExists: false,
      userUpdated: false,
      userUpdateError: false,
      userModalLoading: false,
      password: '',
      invalidPassword: false,
      usernameError: ''
    });
  }
  userModalClose = () => {
    this.props.toggleUserModal();
    this.setState({
      newUsername: '',
      isNewUserValid: false,    
      usernameExists: false,
      userUpdated: false,
      userUpdateError: false,
      userModalLoading: false,
      password: '',
      invalidPassword: false,
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
            this.setState({ isNewUserValid: true });
          }
        }
      }
    }
  };

  // Handle form submission
  handleUserSubmit = async () => {
    const { newUsername, isNewUserValid, password } = this.state;
    const { token } = this.props;

    const fetchPromise = fetch('/usernameChange', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newUsername, password }),
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch timed out"));
      }, 15000);
    });

    if (isNewUserValid) {
      try {
        //these are the different states to show different messages according to the update username api answers
        this.setState({
          userModalLoading: true,
          userUpdated: false,
          userUpdateError: false,
          invalidPassword: false,
          usernameExists: false
        });

        const response = await Promise.race([timeoutPromise, fetchPromise]);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        this.setState({
          userUpdated: true,
        });

        setTimeout(() => {
          this.props.logout();
          window.location.href = '/';
        }, 2500)

      } catch (error) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        //handling the errors state to show the different messages
        if (error.message == 'Invalid password.') {
          this.setState({ invalidPassword: true });
        } else {
          if (error.message == 'Username already exists.') {
            this.setState({ usernameExists: true });
          } else {
            this.setState({ userUpdateError: true, });
          }
        }
        this.setState({ userModalLoading: false });        
      }
    }

  };

  render() {

    const {
      newUsername,
      isNewUserValid,
      usernameExists,
      userUpdated,
      userUpdateError,
      userModalLoading,
      password,
      invalidPassword,
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
        <Modal.Header>Change Your Username</Modal.Header>
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
            <Form.Input
              label='Introduce your Password'
              type='password'
              name='password'
              value={password}
              onChange={this.handleInputChange}
              required
              autoComplete="new-password"
            />
            <Modal.Actions>
              {invalidPassword && (
                <Message negative>
                  <Message.Header>Password error</Message.Header>
                  <p>Your password is not correct, please try again.</p>
                </Message>
              )}
              {usernameExists && (
                <Message negative>
                  <Message.Header>Username already Exists</Message.Header>
                  <p>this username is already in use, please try another one.</p>
                </Message>
              )}
              {userUpdated && (
                <Message positive>
                  <Message.Header>Username updated</Message.Header>
                  <p>Your new username has been changed successfully. Use your new password to log in.</p>
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


module.exports = UserChangeModal;
