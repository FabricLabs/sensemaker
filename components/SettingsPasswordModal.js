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

  class PasswordChangeModal extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        isNewPasswordValid: true,
        passwordMatch: true,
        allValid: true,
        invalidOldPassword: false,
        passwordUpdated: false,
        passwordUpdateError: false,
        passwordModalLoading: false
      };
    }

  passwordModalOpen = () =>{
    this.setState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        isNewPasswordValid: true,
        passwordMatch: true,
        allValid: true,
        invalidOldPassword: false,
        passwordUpdated: false,
        passwordUpdateError: false,
        passwordModalLoading: false
      });
  }
  passwordModalClose = () =>{
    this.props.togglePasswordModal();
    this.setState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        isNewPasswordValid: true,
        passwordMatch: true,
        allValid: true,
        invalidOldPassword: false,
        passwordUpdated: false,
        passwordUpdateError: false,
        passwordModalLoading: false
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
        Authorization: `Bearer ${this.props.token}`,
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
        this.setState({
          passwordModalLoading:true,
          passwordUpdated: false,
          passwordUpdateError: false,
          invalidOldPassword: false,
        });

        const response = await Promise.race([timeoutPromise, fetchPromise]);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        this.setState({passwordUpdated: true, passwordModalLoading:false});

        setTimeout(() => {
          this.props.logout();
          window.location.href = '/';
        }, 2500)

      } catch (error) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        //handling the errors to show the different messages
        if (error.message == 'Invalid password.') {
          this.setState({invalidOldPassword: true});
        } else {
          this.setState({passwordUpdateError: true});
        }
        this.setState({passwordModalLoading:false});
        console.log(error.message);
      }
    }

  };

  render() {
    const {
      oldPassword,
      newPassword,
      confirmNewPassword,
      isNewPasswordValid,
      passwordMatch,
      allValid,
      invalidOldPassword,
      passwordUpdated,
      passwordUpdateError,
      passwordModalLoading } = this.state;

      const {open} = this.props;

    //these next const are for the popup errors showed in the inputs
    const passwordError = (isNewPasswordValid || !newPassword) ? null : {
      content: 'The password must be at least 8 characters, include a capital letter and a number.',
      pointing: 'above',
    };

    const passwordNotMatchError = (passwordMatch || !confirmNewPassword) ? null : {
      content: 'Both passwords must match.',
      pointing: 'above',
    };


    return (
      <Modal
        open={open}
        onOpen={this.passwordModalOpen}
        onClose={this.passwordModalClose}
        size='medium'
      >
        <Modal.Header>Change Your Password</Modal.Header>
        <Modal.Content>
          <Form onSubmit={this.handlePasswordSubmit}>
            <Form.Input
              label='Old Password'
              type='password'
              name='oldPassword'
              onChange={this.handleInputChange}
              autoComplete="new-password"
              required
            />
            <Form.Input
              label='New Password'
              type='password'
              name='newPassword'
              value={newPassword}
              error={passwordError}
              onChange={this.handleInputChange}
              autoComplete="new-password"
              required
            />
            <Form.Input
              label='Confirm New Password'
              type='password'
              name='confirmNewPassword'
              value={confirmNewPassword}
              error={passwordNotMatchError}
              onChange={this.handleInputChange}
              autoComplete="new-password"
              required
            />

            {(allValid && newPassword && !invalidOldPassword) && (
              <p style={{ color: 'green' }}>Both passwords are correct</p>
            )}
            {(oldPassword && newPassword && oldPassword === newPassword) && (
              <p style={{ color: 'red' }}>Old password and new password must be different</p>
            )}
            <Modal.Actions>
              {invalidOldPassword && (
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
              )}

              <Button
                content='Close'
                icon='close'
                size='small'
                secondary
                onClick={this.passwordModalClose}/>
              <Button
                content='Submit'
                icon='checkmark'
                loading={passwordModalLoading}
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


module.exports = PasswordChangeModal;
