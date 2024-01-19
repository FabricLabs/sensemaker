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
      newPassword: '',
      confirmedNewPassword: '',
      passwordError: false, //flag to know if the password matches all the conditions
      passwordMatch: false, //flag for matching between newPassword and confirmedNewPassword
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
      const { invitation, invitationError } = this.props;
      if (invitation.invitationValid) {
        this.setState({ loading: false, tokenError: false, errorContent: '' });
      } else {
        this.setState({ loading: false, tokenError: true, errorContent: invitation.error });
      }
    }
  };

  handleInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value }, () => {
      //here we have the validations for the new password the user is choosing
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

  handleSubmit = async (event) => {
    //this is the function to update the new password for the user
    event.preventDefault();
    const { resetToken } = this.props;
    const { passwordError, passwordMatch, newPassword } = this.state;

    const fetchPromise = fetch('/passwordRestore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword, resetToken }),
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

    const {
      newPassword,
      confirmedNewPassword,
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
      username
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
                    vale={firstName}
                    required
                  />
                  <Form.Input
                    size='small'
                    label='Last name'
                    type='text'
                    name='lastName'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    vale={lastName}
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
                    vale={firmName}
                  />
                  <Form.Input
                    size='small'
                    label='Firm size'
                    type='number'
                    name='firmSize'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    vale={firmSize}
                  />
                </Form.Group>
                <Form.Group className='singup-form-group'>
                  <Form.Input
                    size='small'
                    label='Username'
                    type='text'
                    name='username'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    vale={username}
                    required
                  />
                  <Form.Input
                    size='small'
                    label='Email'
                    type='email'
                    name='email'
                    onChange={this.handleInputChange}
                    autoComplete="off"
                    vale={username}
                    required
                  />
                </Form.Group>

                <p>Password must have at least 8 characters, a capital letter and a number.</p>
                <Form.Group className='singup-form-group'>
                  <Form.Input
                    size='small'
                    label='Password'
                    type='password'
                    name='newPassword'
                    error={passwordErrorMessage}
                    onChange={this.handleInputChange}
                    autoComplete="new-password"
                    vale={newPassword}
                    required
                  />
                  <Form.Input
                    size='small'
                    label='Confirm Password'
                    type='password'
                    name='confirmedNewPassword'
                    error={passwordNotMatchError}
                    onChange={this.handleInputChange}
                    autoComplete="new-password"
                    value={confirmedNewPassword}
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
                  disabled={passwordError || !passwordMatch}
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
