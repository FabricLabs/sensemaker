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
  Header,
  Segment,
  Label
} = require('semantic-ui-react');

//this is the form that lets you choose a new password if you come with a valid token
class SingUpForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      confirmedPassword: '',
      passwordError: false, //flag to know if the password matches all the conditions
      passwordMatch: false, //flag for matching between password and confirmedPassword
      tokenError: false,
      loading: false,
      updatedPassword: false, //flag to check if API updated the password
      updateError: false, //true if an error comes from the API while updating
      errorContent: '',
      firstName: '',
      lastName: '',
      firmName: '',
      firmSize: 0,
      username: '',
      email: '',
      isNewUserValid: false,
      usernameError: '',
      isEmailValid: false,
      emailError: '',
    };
  }

  componentDidMount = async () => {
    //when the user is sent to /passwordreset/:resetToken, first when this componen mounts
    //it checks if the :resetToken is a valid one

    //NOTE: I DON'T LIKE THIS TITLE SETTING
    document.title = "Novo · Your Legal Assistant";

    const { invitationToken, invitation, invitationError } = this.props;
    this.setState({ loading: true });
    try {
      await this.props.checkInvitationToken(invitationToken);
    } catch (error) {
      this.setState({ loading: false, tokenError: true, errorContent: 'Internal server error, please try again later.' });
    }
  };


  componentDidUpdate(prevProps) {
    if (prevProps.invitation !== this.props.invitation) {
      const { invitation } = this.props;
      if (invitation.invitationValid) {
        this.setState({ loading: false, tokenError: false, errorContent: '' });
      } else {
        this.setState({ loading: false, tokenError: true, errorContent: invitation.error });
      }
    }
    if (prevProps.auth !== this.props.auth) {
      const { auth } = this.props;
      if (auth.usernameAvailable && this.state.username) {
        this.setState({ isNewUserValid: true, usernameError: '' });
      } else {
        this.setState({ isNewUserValid: false, usernameError: 'Username already exists. Please choose a different one.' });
      }
      if (auth.emailAvailable && this.state.email) {
        this.setState({ isEmailValid: true, emailError: '' });
      } else {
        this.setState({ isEmailValid: false, emailError: 'Email already registered, please choose a differnt one.' });
      }
    }
  };

  handleInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value }, () => {
      //here we have the validations for the new password the user is choosing
      if (event.target.name === 'password') {
        this.setState({
          passwordError: this.validatepassword(event.target.value) ? false : true,
        });
      }
      this.setState({
        passwordMatch: this.validatePasswordsMatch() ? true : false,
      });
      if (event.target.name === 'username') {
        this.validateUsername(event.target.value);

      }
      if (event.target.name === 'email') {
        this.props.checkEmailAvailable(event.target.value);
      }
    });
  };

  handleSubmit = async (event) => {
    //this is the function to update the new password for the user
    event.preventDefault();
    const { resetToken } = this.props;
    const { passwordError, passwordMatch, password } = this.state;

    const fetchPromise = fetch('/passwordRestore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, resetToken }),
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

        this.setState({ updatedPassword: true, passwordModalLoading: false });

      } catch (error) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.setState({ updateError: true, errorContent: error.message, loading: false, });
      }
    }
  }

  validateUsername = (value) => {
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
        this.props.checkUsernameAvailable(value);
      }
    }
  }

  validatepassword = (password) => {
    const hasEightCharacters = password.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasEightCharacters && hasCapitalLetter && hasNumber;
  };

  validatePasswordsMatch = () => {
    return (this.state.password && this.state.confirmedPassword && this.state.password === this.state.confirmedPassword);
  }

  render() {

    const {
      password,
      confirmedPassword,
      loading,
      passwordError,
      passwordMatch,
      errorContent,
      updateError,
      updatedPassword,
      tokenError,
      firstName,
      lastName,
      firmName,
      firmSize,
      username,
      isNewUserValid,
      usernameError,
      email,
      isEmailValid,
      emailError,
    } = this.state;

    //these next const are for the popup errors showed in the inputs
    const passwordErrorMessage = (!passwordError || !password) ? null : {
      content: 'The password must be at least 8 characters, include a capital letter and a number.',
      pointing: 'above',
    };

    const passwordNotMatchErrorMsg = (passwordMatch || !confirmedPassword) ? null : {
      content: 'Both passwords must match.',
      pointing: 'above',
    };

    const userErrorMsg = (isNewUserValid || !username) ? null : {
      content: usernameError,
      pointing: 'above',
    };

    const emailErrorMsg = (isEmailValid || !email) ? null : {
      content: emailError,
      pointing: 'above',
    };


    return (
      <div className='fade-in singup-form'>
        <Segment>
          <Form onSubmit={this.handleSubmit} loading={this.state.loading} centered>
            {(!tokenError) && (
              <section>
                <Header as='h3' textAlign="center">Sing Up Form</Header>
                <p>Please complete the registration form below to create your account and access our services.</p>
                <Form.Group className='singup-form-group'>
                  <Form.Input
                    size='small'
                    label='First name'
                    type='text'
                    name='firstName'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    value={firstName}
                    required
                  />
                  <Form.Input
                    size='small'
                    label='Last name'
                    type='text'
                    name='lastName'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    value={lastName}
                    required
                  />
                </Form.Group>
                <Form.Group className='singup-form-group'>
                  <Form.Input
                    size='small'
                    label='Firm name'
                    type='text'
                    name='firmName'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    value={firmName}
                  />
                  <Form.Input
                    size='small'
                    label='Firm size'
                    type='number'
                    name='firmSize'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    value={firmSize}
                  />
                </Form.Group>
                <Form.Group className='singup-form-group'>
                  <Form.Input
                    size='small'
                    label='Username'
                    type='text'
                    name='username'
                    error={userErrorMsg}
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    value={username}
                    required
                  />
                  <Form.Input
                    size='small'
                    label='Email'
                    type='email'
                    name='email'
                    error={emailErrorMsg}
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    value={email}
                    required
                  />
                </Form.Group>

                <p>Password must have at least 8 characters, a capital letter and a number.</p>
                <Form.Group className='singup-form-group'>
                  <Form.Input
                    size='small'
                    label='Password'
                    type='password'
                    name='password'
                    error={passwordErrorMessage}
                    onChange={this.handleInputChange}
                    autoComplete="new-password"
                    value={password}
                    required
                  />
                  <Form.Input
                    size='small'
                    label='Confirm Password'
                    type='password'
                    name='confirmedPassword'
                    error={passwordNotMatchErrorMsg}
                    onChange={this.handleInputChange}
                    autoComplete="new-password"
                    value={confirmedPassword}
                    required
                  />
                </Form.Group>

                <Button
                  content='Submit'
                  icon='checkmark'
                  loading={loading}
                  type='submit'
                  fluid
                  primary
                  disabled={
                    passwordError || !passwordMatch ||
                    !isNewUserValid || usernameError ||
                    !isEmailValid || emailError
                  }//the button submit is disabled until all requiriments and validations are correct
                />
              </section>
            )}
            {tokenError && (
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
        </Segment>
      </div>
    );
  }
}

function SingUp(props) {
  const { invitationToken } = useParams();
  return <SingUpForm invitationToken={invitationToken} {...props} />;
}
module.exports = SingUp;
