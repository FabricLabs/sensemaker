'use strict';

// Dependencies
const React = require('react');
const {
  useParams
} = require('react-router-dom');

// Semantic UI
const {
  Form,
  Button,
  Message,
  Header,
  Segment,
  Image
} = require('semantic-ui-react');

class SignUpForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      confirmedPassword: '',
      passwordError: false, //flag to know if the password matches all the conditions
      passwordMatch: false, //flag for matching between password and confirmedPassword
      tokenError: false,
      loading: false,
      registerSuccess: false,
      registerError: false,
      errorContent: '',
      firstName: '',
      lastName: '',
      firmName: '',
      firmSize: null,
      username: '',
      email: '',
      isNewUserValid: false,
      usernameError: '',
      isEmailValid: false,
      emailError: '',
    };
  }

  componentDidMount = async () => {
    //NOTE: I DON'T LIKE THIS TITLE SETTING
    document.title = "Novo · Your Legal Assistant";

    const { invitationToken, invitation, invitationErro, adminPanel } = this.props;
    console.log('first mount admin panel: ', adminPanel)
    
    if (!adminPanel) {
      this.setState({ loading: true });
      try {
        await this.props.checkInvitationToken(invitationToken);
      } catch (error) {
        this.setState({ loading: false, tokenError: true, errorContent: 'Internal server error, please try again later.' });
      }
    } else {this.setState({loading :false, tokenError:false})}

  };


  componentDidUpdate(prevProps) {
    const {adminPanel} = this.props
    console.log('admin panel: ', adminPanel)
    if (!adminPanel) {
      //it goes here when the invitation reducer changes
      if (prevProps.invitation !== this.props.invitation) {
        const { invitation } = this.props;
        if (invitation.invitationValid) {
          this.setState({ loading: false, tokenError: false, errorContent: '', emailError: null, email: this.props.invitation.invitation.target });
          this.props.checkEmailAvailable(this.props.invitation.invitation.target);
        } else {
          this.setState({ loading: false, tokenError: true, errorContent: invitation.error });
        }
      }
    }

    //it goes here when the auth reducer changes
    if (prevProps.auth !== this.props.auth) {
      const { auth } = this.props;
      //if the username is available and the username state is not empty
      if (auth.usernameAvailable && this.state.username) {
        this.setState({ isNewUserValid: true, usernameError: '' });
      } else {
        this.setState({ isNewUserValid: false, usernameError: 'Username already exists. Please choose a different one.' });
      }

      //if the email is available and the username state is not empty
      if (auth.emailAvailable && this.state.email) {
        this.setState({ isEmailValid: true, emailError: '' });
      } else {
        this.setState({ isEmailValid: false, emailError: 'Email already registered, please choose a differnt one.' });
      }
      //checks if the state.registering is true (because we pressed submit and started handleSubmit)
      //and auth.registering is false when the reducer finished processing actions
      if (this.state.registering && !auth.registering) {
        this.setState({ registering: false });
        if (auth.registerSuccess) {
          this.setState({ registerSuccess: true, registerError: false, errorContent: '' });
          if (!adminPanel) {
            this.props.acceptInvitation(this.props.invitationToken);
          }
        } else {
          this.setState({ registerSuccess: false, registerError: true, errorContent: auth.error });
        }
      }
    }
  };

  handleInputChange = (event) => {
    event.preventDefault();
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
        //if previouse validations are OK, then it calls this api action
        this.props.checkEmailAvailable(event.target.value);
      }
    });
  };

  handleSubmit = async (event) => {
    //this is the function to update the new password for the user
    event.preventDefault();
    const { resetToken } = this.props;
    const { username, password, email, firstName, lastName, firmName, firmSize } = this.state;

    try {
      //here we call the register api action, we set our state to registering
      //until we have the answer from reducer in componentDidUpdate
      this.setState({ registering: true });
      //forced delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await this.props.fullRegister(username, password, email, firstName, lastName, firmName, firmSize);

    } catch (error) {
      this.setState({ registering: false });
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
        //if previouse validations are OK, then it calls this api action
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
      registerSuccess,
      registerError,
      registering,
      adminPanel,
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

    //the error message wont be shown if the username state or email state are still empty, those error will start
    //showing once the user writes and invalid username or email
    const userErrorMsg = (isNewUserValid || !username) ? null : {
      content: usernameError,
      pointing: 'above',
    };

    const emailErrorMsg = (isEmailValid || !email || emailError === null) ? null : {
      content: emailError,
      pointing: 'above',
    };

    return (
      <div className='fade-in signup-form'>
        {
          !this.props.adminPanel ? 
          <Image src="/images/novo-logo.svg" style={{ maxWidth: '400px', height: 'auto', marginBottom: '1em' }} />
          : ''
        }
        <Segment>
          <Form loading={loading} centered>
            {(!tokenError && !registerSuccess) && (
              <section>
                {
                  !this.props.adminPanel ?
                  <>
                    <Header as='h3' textAlign="center">Sign Up</Header>
                    <p>Complete your registration to access Novo.</p>
                  </>
                  : ''
                }
                <Form.Group className='signup-form-group'>
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
                <Form.Group className='signup-form-group'>
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
                <Form.Group className='signup-form-group'>
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
                    error={emailError ? emailErrorMsg : null}
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    value={email}
                    required
                  />
                </Form.Group>

                <p>Password must have at least 8 characters, a capital letter and a number.</p>
                <Form.Group className='signup-form-group'>
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
                {(registerError) && (
                  <Message negative>
                    <p>{errorContent}</p>
                  </Message>
                )}
                <Button
                  content='Submit'
                  icon='checkmark'
                  loading={registering}
                  onClick={this.handleSubmit}
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
            {(tokenError) && (
              <Message negative>
                <Message.Header style={{ marginBottom: '1rem' }}>Something went wrong.</Message.Header>
                <p>{errorContent}</p>
              </Message>
            )}
            {registerSuccess && (
              <Message positive centered>
                <Message.Header style={{ marginBottom: '1rem' }}>Registration Successful</Message.Header>
                <p>Your account has been successfully created. Thank you for registering with Novo.</p>
                <p>Please log in to access your account and start utilizing our services.</p>
                <div style={{ margintop: '1.5rem', textAlign: 'center' }}>
                  <Button primary href="/sessions">Log In</Button>
                </div>
              </Message>
            )}
          </Form>
        </Segment>
      </div>
    );
  }
}

function SignUp(props) {
  const { invitationToken } = useParams();
  return <SignUpForm invitationToken={invitationToken} {...props} />;
}
module.exports = SignUp;
