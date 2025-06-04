'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Breadcrumb,
  Button,
  Card,
  Header,
  Icon,
  Label,
  Segment,
  Form,
  Input
} = require('semantic-ui-react');

const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

// Login state machine states
const LoginState = {
  INITIAL: 'INITIAL',
  AUTHENTICATING: 'AUTHENTICATING',
  AUTHENTICATED: 'AUTHENTICATED',
  ERROR: 'ERROR'
};

class MatrixLoginPage extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      matrix: {},
      state: {
        matrix: {
          channels: [],
          servers: [],
          users: []
        }
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state,
      loginState: LoginState.INITIAL,
      loginError: null,
      homeserver: 'https://matrix.org',
      homeserverValid: null,
      homeserverValidating: false,
      username: '',
      password: '',
      showPassword: false
    };

    // Fabric State
    this._state = {
      matrix: {
        channels: {},
        servers: {},
        users: {}
      },
      content: this.settings.state
    };

    // Bind methods
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validateHomeserver = this.validateHomeserver.bind(this);

    return this;
  }

  componentDidMount () {
    this.props.fetchMatrixStats();
    this.watcher = setInterval(() => {
      this.props.fetchMatrixStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  async validateHomeserver (homeserver) {
    if (!homeserver) return;
    this.setState({ homeserverValidating: true });
    try {
      // Try to fetch the server's well-known file
      const response = await fetch(`${homeserver}/.well-known/matrix/client`);
      if (response.ok) {
        this.setState({ homeserverValid: true, homeserverValidating: false });
      } else {
        // If well-known fails, try direct connection to check if it's a matrix server
        const serverResponse = await fetch(`${homeserver}/_matrix/client/versions`);
        if (serverResponse.ok) {
          this.setState({ homeserverValid: true, homeserverValidating: false });
        } else {
          this.setState({ homeserverValid: false, homeserverValidating: false });
        }
      }
    } catch (error) {
      this.setState({ homeserverValid: false, homeserverValidating: false });
    }
  }

  handleInputChange (e, { name, value }) {
    this.setState({ [name]: value });
    if (name === 'homeserver') {
      // Reset validation state
      this.setState({ homeserverValid: null });
      // Debounce the validation
      clearTimeout(this._homeserverValidationTimer);
      this._homeserverValidationTimer = setTimeout(() => {
        this.validateHomeserver(value);
      }, 500);
    }
  }

  handleSubmit (e) {
    e.preventDefault();
    const { homeserver, username, password } = this.state;

    if (!homeserver || !username || !password) {
      this.setState({
        loginState: LoginState.ERROR,
        loginError: 'Username and password are required'
      });
      return;
    }

    this.setState({ loginState: LoginState.AUTHENTICATING }, async () => {
      try {
        const response = await this.props.authenticateMatrix({
          homeserver,
          username,
          password
        });

        console.debug('auth esponse', response);

        this.setState({
          loginState: LoginState.AUTHENTICATED,
          password: '' // Clear password from state for security
        });
      } catch (error) {
        this.setState({
          loginState: LoginState.ERROR,
          loginError: error.message || 'Authentication failed',
          password: '' // Clear password on error
        });
      }
    });
  }

  handleLoginClick () {
    // This is now handled by handleSubmit
    return;
  }

  renderLoginCard () {
    const { 
      loginState, 
      loginError, 
      homeserver,
      homeserverValid,
      homeserverValidating,
      username, 
      password, 
      showPassword 
    } = this.state;

    return (
      <Card fluid>
        <Card.Content>
          <Card.Header>Sign In to Matrix</Card.Header>
          <Card.Description>
            <Form onSubmit={this.handleSubmit} error={loginState === LoginState.ERROR}>
              {loginState === LoginState.ERROR && (
                <Label color='red' basic style={{ marginBottom: '1em', width: '100%' }}>
                  <Icon name='warning' />
                  {loginError || 'An error occurred during login'}
                </Label>
              )}
              
              <Form.Field>
                <label>Homeserver</label>
                <Input
                  name="homeserver"
                  value={homeserver}
                  onChange={this.handleInputChange}
                  placeholder="Enter your homeserver URL"
                  icon={
                    <Icon 
                      name={
                        homeserverValidating ? 'spinner' : 
                        homeserverValid === true ? 'check' :
                        homeserverValid === false ? 'x' : 'server'
                      }
                      loading={homeserverValidating}
                      color={
                        homeserverValid === true ? 'green' :
                        homeserverValid === false ? 'red' : 'grey'
                      }
                    />
                  }
                  iconPosition="left"
                  disabled={loginState === LoginState.AUTHENTICATING}
                  required
                  error={homeserverValid === false}
                />
              </Form.Field>

              <Form.Field>
                <label>Username</label>
                <Input
                  name="username"
                  value={username}
                  onChange={this.handleInputChange}
                  placeholder="Enter your username"
                  icon="user"
                  iconPosition="left"
                  disabled={loginState === LoginState.AUTHENTICATING}
                  required
                />
              </Form.Field>

              <Form.Field>
                <label>Password</label>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={this.handleInputChange}
                  placeholder="Enter your password"
                  icon={
                    <Icon
                      name={showPassword ? "eye slash" : "eye"}
                      link
                      onClick={() => this.setState(prev => ({ showPassword: !prev.showPassword }))}
                    />
                  }
                  iconPosition="right"
                  disabled={loginState === LoginState.AUTHENTICATING}
                  required
                />
              </Form.Field>

              <Button
                primary
                type="submit"
                fluid
                loading={loginState === LoginState.AUTHENTICATING}
                disabled={loginState === LoginState.AUTHENTICATING}
              >
                {loginState === LoginState.AUTHENTICATING ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form>
          </Card.Description>
        </Card.Content>
      </Card>
    );
  }

  render () {
    const { matrix } = this.props;
    return (
      <div style={{ minHeight: '100%', maxHeight: '100%', overflow: 'auto' }}>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/matrix'>Matrix</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={matrix?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}>Matrix</Header>
          <Card.Group>
            {this.renderLoginCard()}
          </Card.Group>
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = MatrixLoginPage;
