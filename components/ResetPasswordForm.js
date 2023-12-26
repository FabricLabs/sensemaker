'use strict';

// Dependencies
const React = require('react');
const {
  useParams
} = require('react-router-dom');

// Semantic UI
const {
  Link,
  Form,
  Button,
  Message,
} = require('semantic-ui-react');

class ResetPasswordForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      newPassword: '',
      confirmedNewPassword: '',
      passwordError: false, //flag to know if the password matches all the conditions
      passwordMatch: false, //flag for matching between newPassword and confirmedNewPassword
      tokenError: false,
      loading: false,
      updatedPassword: false, //flag to check if API updated the password
      updateError: false, //true if an error comes from the API while updating
      errorContent: '',
    };
  }

  componentDidMount() {
    const { resetToken } = this.props;

    const fetchPromise = fetch('/resettokencheck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resetToken }),
    });

  }

  handleInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value }, () => {
      if (event.target.name === 'newPassword') {
        this.setState({
          passwordError: this.validateNewPassword(event.target.value) ? false : true,
        });
      }
      this.setState({
        passwordMatch: this.validatePasswordsMatch() ? true : false,
      });
    });
  };

  handleSubmit = async () => {
    const { token } = this.props;
    const { passwordError, passwordMatch, newPassword } = this.state;

    const fetchPromise = fetch('/passwordrestore', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword }),
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Error updating your password, please check your internet connection.'));
      }, 15000);
    });

    if (!passwordError && passwordMatch) {
      try {
        this.setState({
          loading: true,
          updatedPassword: false,
          updateError: false,
        });

        const response = await Promise.race([timeoutPromise, fetchPromise]);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        this.setState({ passwordUpdated: true, passwordModalLoading: false });

        setTimeout(() => {
          this.props.logout();
          window.location.href = '/';
        }, 2500)

      } catch (error) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.setState({ updateError: true, errorContent: error.message, loading: false, });
      }
    }
  }

  validateNewPassword = (newPassword) => {
    const hasEightCharacters = newPassword.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    return hasEightCharacters && hasCapitalLetter && hasNumber;
  };

  validatePasswordsMatch = () => {
    return (this.state.newPassword && this.state.confirmedNewPassword && this.state.newPassword === this.state.confirmedNewPassword);
  }


  render() {
    const { token } = this.props;
    const {
      newPassword,
      confirmedNewPassword,
      loading,
      passwordError,
      passwordMatch,
      errorContent,
      updateError,
      updatedPassword
    } = this.state;

    //these next const are for the popup errors showed in the inputs
    const passwordErrorMessage = (!passwordError || !newPassword) ? null : {
      content: 'The password must be at least 8 characters, include a capital letter and a number.',
      pointing: 'above',
    };

    const passwordNotMatchError = (passwordMatch || !confirmedNewPassword) ? null : {
      content: 'Both passwords must match.',
      pointing: 'above',
    };

    return (
      <Form onSubmit={this.handleSubmit}>
        {!updatedPassword && (
          <section>
            <p>Please choose a new Password for your account. It must have at least 8 characters, a capital letter and a number.</p>
            <Form.Input
              size='mini'
              label='New Password'
              type='password'
              name='newPassword'
              error={passwordErrorMessage}
              onChange={this.handleInputChange}
              autoComplete="new-password"
              vale={newPassword}
              required
            />
            <Form.Input
              size='mini'
              label='Confirm New Password'
              type='password'
              name='confirmedNewPassword'
              error={passwordNotMatchError}
              onChange={this.handleInputChange}
              autoComplete="new-password"
              value={confirmedNewPassword}
              required
            />
            <Button
              content='Submit'
              icon='checkmark'
              loading={loading}
              type='submit'
              fluid
              primary
              disabled={passwordError || !passwordMatch}
            />
          </section>
        )}
        {updateError && (
          <Message negative>
            <p>{errorContent}</p>
          </Message>
        )}
        {updatedPassword && (
          <Message positive>
            <Message.Header>Password updated</Message.Header>
            <p>Your new password has been changed successfully. Use your new password to log in.</p>
            <a href="/sessions/new">Log In &raquo;</a>
          </Message>
        )}
      </Form>
    );
  }
}

function PwdReset(props) {
  const { resetToken } = useParams();
  return <ResetPasswordForm resettoken={resetToken} {...props} />;
}
module.exports = PwdReset;
