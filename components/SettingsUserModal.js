'use strict';

const React = require('react');

const {
    Button,
    Header,
    Segment,
    Table,
    Form,
    Modal,
    Message
  } = require('semantic-ui-react');

  class UserChangeModal extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        token: this.props.token,
        open: this.props.open,
        newUsername: '',
        isNewUserValid: true,
        allValid: true,
        usernameExists: false, //state to check if the new username already exists
        userUpdated: false,
        userUpdateError: false,
        userModalLoading: false,
        password: '',
        invalidPassword: false
      };
    }

  userModalOpen = () =>{
    this.setState({
        newUser: '',
        isNewUserValid: true,
        allValid: true,
        usernameExists: false,
        userUpdated: false,
        userUpdateError: false,
        userModalLoading: false,
        password: '',
        invalidPassword: false
      });
  }
  userModalClose = () =>{
    this.props.toggleUserModal();
    this.setState({
        newUser: '',
        isNewUserValid: true,
        allValid: true,
        usernameExists: false,
        userUpdated: false,
        userUpdateError: false,
        userModalLoading: false,
        password: '',
        invalidPassword: false
      });
  }


  // Handle input change
  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };

  validateNewPassword = (newPassword) => {
    const hasEightCharacters = newPassword.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    return hasEightCharacters && hasCapitalLetter && hasNumber;
  };

  validatePasswordsMatch = () =>{
    return (this.state.newPassword && this.state.confirmNewPassword && this.state.newPassword === this.state.confirmNewPassword);
  }

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value }, () => {
        const isValidPassword = this.validateNewPassword(this.state.newPassword);
        const isMatched = this.validatePasswordsMatch();
        const isAllValid = (isValidPassword && isMatched && this.state.newPassword !== this.state.oldPassword);
        this.setState({ isNewPasswordValid: isValidPassword, passwordMatch: isMatched, allValid: isAllValid });
    });
  };

  // Handle form submission
  handlePasswordSubmit = async () => {
    const { oldPassword, newPassword, allValid } = this.state;

    const fetchPromise = fetch('/passwordChange', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.state.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch timed out"));
      }, 15000);
    });

    if (allValid) {
      try {
        this.setState({passwordModalLoading:true});

        const response = await Promise.race([timeoutPromise, fetchPromise]);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        this.setState({
          passwordUpdated: true,
          passwordUpdateError: false,
          invalidOldPassword: false,
          passwordModalLoading: false
        });

        setTimeout(() => {
          this.props.logout();
          window.location.href = '/';
        }, 2500)

      } catch (error) {
        if (error.message == 'Invalid password.') {
          this.setState({
            passwordUpdated: false,
            passwordUpdateError: false,
            invalidOldPassword: true,
          });
        } else {
          this.setState({
            passwordUpdated: false,
            passwordUpdateError: true,
            invalidOldPassword: false,
          });
        }
        this.setState({passwordModalLoading:false});
        console.log(error.message);
      }
    }

  };

  render() {

      const {
          newUsername,
          isNewUserValid,
          allValid,
          usernameExists,
          userUpdated,
          userUpdateError,
          userModalLoading,
          password,
          validPassword,
      } = this.state;

      const { open } = this.props;


    // const passwordInputStyle = isNewPasswordValid ? { borderColor: 'green' } : { borderColor: 'red' };
    const usernameError = (isNewUserValid || !newUsername) ? null : {
      content: 'The username must be at least 6 characters',
      pointing: 'above',
    };

    const usernameExistsError = (!usernameExists) ? null : {
      content: 'Username already Exists, please select another one.',
      pointing: 'above',
    };

    //shows the errors related to the username
    const popUpError = usernameError ? usernameError : usernameExistsError;

    const invalidPassowrdError = (!usernameExists) ? null : {
      content: 'Username already Exists, please select another one.',
      pointing: 'above',
    };


    return (
      <Modal
        open={open}
        onOpen={this.userModalOpen}
        onClose={this.userModalClose}
        size='medium'
      >
        <Modal.Header>Change Your Username</Modal.Header>
        <Modal.Content>
          <Form onSubmit={this.handlePasswordSubmit}>
            <Form.Input
              label='New Username'
              name='newUsername'
              value={newUsername}
              error={popUpError}
              onChange={this.handleInputChange}
              required
            />
            <Form.Input
              label='Introduce your Password'
              type='password'
              name='password'
              value={password}
              error={invalidPassowrdError}
              onChange={this.handleInputChange}
              required
            />
{/*
            {(allValid && newPassword && !invalidOldPassword) && (
              <p style={{ color: 'green' }}>Both passwords are correct</p>
            )}
            {(oldPassword && newPassword && oldPassword === newPassword) && (
              <p style={{ color: 'red' }}>Old password and new password must be different</p>
            )} */}
            <Modal.Actions>
              {/* {invalidOldPassword && (
                <Message negative>
                  <Message.Header>Password error</Message.Header>
                  <p>Your old password is not correct, please try again.</p>
                </Message>
              )}
              {passwordUpdated && (
                <Message positive>
                  <Message.Header>Password updated</Message.Header>
                  <p>Your new password has been changed successfully. Use your new password to log in.</p>
                </Message>
              )}
              {passwordUpdateError && (
                <Message negative>
                  <Message.Header>Internal server error</Message.Header>
                  <p>Please try again later.</p>
                </Message>
              )} */}

              <Button
                content='Close'
                icon='close'
                size='small'
                secondary
                onClick={this.userModalClose}/>
              <Button
                content='Submit'
                icon='checkmark'
                loading={userModalLoading}
                type='submit' size='small'
                primary
                disabled={!allValid} />
            </Modal.Actions>
          </Form>
        </Modal.Content>
      </Modal>
    );
  };
}


module.exports = UserChangeModal;
