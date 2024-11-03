'use strict';

// Constants
const { ENABLE_DISCORD_LOGIN } = require('../constants');

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');
const AskPasswordResetModal = require('./LoginFormAskResetModal');

// Semantic UI
const {
  Button,
  Divider,
  Form,
  Icon,
  Message
} = require('semantic-ui-react');

class LoginForm extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      loading: false,
      username: '',
      password: '',
      pwdModalOpen: false,
    };
  }

  componentDidUpdate (prevProps) {
    // If a new login request has been initiated or an error has occurred, stop loading
    if ((this.props.error === null && prevProps.error !== null) || (this.props.error && prevProps.error !== this.props.error)) {
      this.setState({ loading: false });
    }
  }

  handleUsernameChange = (event) => {
    this.setState({ username: event.target.value });
  };

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { username, password } = this.state;
    this.setState({ loading: true });
    this.props.login(username, password);
  };

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  // Toggle the modal
  togglePasswordModal = () => {
    this.setState(prevState => ({
      pwdModalOpen: !prevState.pwdModalOpen
    }));
  };

  render () {
    const { username, password, loading, pwdModalOpen } = this.state;
    const { error } = this.props;

    return (
      <fabric-react-component class="ui primary action fluid text container" style={{paddingTop:'0'}}>
        <Form onSubmit={this.handleSubmit} size={this.props.size} method="POST">
          {error && <Message error visible content={error} style={{ clear: 'both', marginTop: '1em' }} />}
          <Form.Field>
            <label>Username (or Email)</label>
            <input placeholder="Username" name="username" autoComplete="username" value={username} onChange={this.handleUsernameChange} />
          </Form.Field>
          <Form.Field>
            <label>Password</label>
            <input type="password" autoComplete="current-password" placeholder="Password" name="password" value={password} onChange={this.handlePasswordChange} />
            <p style={{ marginTop: '2em' }}>Forgot your password?  <a onClick={this.togglePasswordModal}>Reset Password &raquo;</a></p>
          </Form.Field>
          <div>
            <Button fluid primary color='green' icon labelPosition='right' loading={loading} type="submit" size={this.props.size}>Log In <Icon name='right chevron' /></Button>
            {ENABLE_DISCORD_LOGIN && (<a href='/services/discord/authorize' className='ui fluid violet right labeled icon button'><span><Icon name='discord alt' /></span> Discord <Icon name='right chevron' /></a>)}
            <Divider />
            <Button as={Link} to='/' fluid icon labelPosition='left' size='small' color='black'><Icon name='left chevron' />Return Home</Button>
          </div>
        </Form>
        <AskPasswordResetModal open={pwdModalOpen} togglePasswordModal={this.togglePasswordModal}/>
      </fabric-react-component>
    );
  }
}

module.exports = LoginForm;
