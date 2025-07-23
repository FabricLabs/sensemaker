'use strict';

// Constants
const {
  BRAND_NAME,
  BROWSER_DATABASE_NAME,
  BROWSER_DATABASE_TOKEN_TABLE,
  IS_CONFIGURED
} = require('../constants');

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { renderToString } = require('react-dom/server');
const {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate
} = require('react-router-dom');

// Components
// Semantic UI
const {
  Modal,
  Button,
  Header,
  Icon,
  Loader
} = require('semantic-ui-react');

// Local Components
const FrontPage = require('./FrontPage');
const Splash = require('./Splash');
const InquiriesHome = require('./InquiriesHome');
const InvitationView = require('./InvitationView');
const FeaturesHome = require('./FeaturesHome');
const Dashboard = require('./Dashboard');
const TermsOfUseModal = require('./TermsOfUseModal');
const LoginPage = require('./LoginPage');
const NotFound = require('./NotFound');
const TermsOfUse = require('./TermsOfUse');
const Onboarding = require('./Onboarding');
const Waitlist = require('./Waitlist');
const Bridge = require('./Bridge');
const Store = require('./Store');

/**
 * The Sensemaker UI.
 */
class SensemakerUI extends React.Component {
  constructor (props) {
    super(props);

    // Initialize bridge
    this.bridge = new Bridge({
      responseCapture: this.handleMessageSuccess.bind(this)
    });

    // Initialize store
    this.store = new Store({
      debug: false
    });

    // Create ref for onboarding component
    this.onboardingRef = React.createRef();

    this.state = {
      isAuthenticated: false,
      isLoading: true,
      modalLogOut: false,
      loggedOut: false,
      isConfigured: IS_CONFIGURED, // Track configuration status dynamically
      configurationLoading: true, // Loading state for configuration check
    };
  }

  handleLoginSuccess = () => {
    console.log('setting isAuthenticated = true ...');
    this.setState({ isAuthenticated: true });

    // Fetch configuration status when user logs in
    if (this.props.token) {
      this.setState({ configurationLoading: true });
      this.fetchConfigurationStatus();
    }
  }

  handleMessageSuccess = (action) => {
    const { id, isAdmin } = this.props.auth;

    // If we have a conversation ID in the response, navigate to it
    if (action && action.payload && action.payload.message && action.payload.message.object) {
      const result = action.payload.message.object;

      // Check if this is a new conversation (has conversation ID but no previous chat)
      if (result.conversation && !this.props.chat?.message?.conversation) {
        console.debug('[SENSEMAKER_UI]', 'Navigating to new conversation:', result.conversation);

        // Navigate to the new conversation
        window.location.href = `/conversations/${result.conversation}`;
      }
    }
  }

  handleRegisterSuccess = () => {
    console.log('registered = true ...');
    this.setState({ registered: true });
  }

  handleLogout = () => {
    this.setState({
      modalLogOut: true
    });
  }

  handleLogoutSuccess = () => {
    console.log('setting isAuthenticated = false ...');
    this.setState({ loggedOut: true });
    setTimeout(() => {
      this.setState({
        isAuthenticated: false,
        isLoading: false,
        modalLogOut: false,
        loggedOut: false
      });
      this.props.logout();
      window.location.href = '/';

      //window.location.reload();
    }, 2000);
  }

  handleModalClose = () => {
    this.setState({
      isAuthenticated: false,
      isLoading: false,
      modalLogOut: false
    });
  }

  handleConversationSubmit = async (message) => {
    try {
      const response = await fetch('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.props.token}`
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success) {
        this.props.fetchConversations();
      } else {
        throw new Error(data.message || 'Message submission failed');
      }
    } catch (error) {
      console.error(error);
    }
  }

  handleConfigurationComplete = () => {
    // Configuration completed successfully - update state to reflect this
    console.log('[SENSEMAKER:UI] Configuration completed, updating state...');
    this.setState({
      isConfigured: true,
      configurationLoading: false
    });
  }

  handleOpenConfiguration = () => {
    // Open the configuration modal using the ref
    if (this.onboardingRef.current) {
      this.onboardingRef.current.handleOpen();
    }
  }

  fetchConfigurationStatus = async () => {
    try {
      const response = await fetch('/settings/IS_CONFIGURED', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.props.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[SENSEMAKER:UI] Fetched configuration status:', data);

        // Update state with the server's configuration status
        this.setState({
          isConfigured: data.value === true || data.value === 'true',
          configurationLoading: false
        });
      } else {
        console.warn('[SENSEMAKER:UI] Failed to fetch configuration status:', response.status);
        // Fall back to the constant value if the request fails
        this.setState({
          isConfigured: IS_CONFIGURED,
          configurationLoading: false
        });
      }
    } catch (error) {
      console.error('[SENSEMAKER:UI] Error fetching configuration status:', error);
      // Fall back to the constant value if there's an error
      this.setState({
        isConfigured: IS_CONFIGURED,
        configurationLoading: false
      });
    }
  }

  componentDidMount () {
    // Start the bridge connection
    if (this.bridge) {
      console.debug('[SENSEMAKER:UI]', 'Starting bridge connection...');
      this.bridge.start();
    }

    // Set the application instance
    window.application = this;

    // TODO: re-work authentication, use `seed` and `xprv` upstream (@fabric/hub)
    // old IndexedDB code
    //if the user was already logged in previously, we reload the session
    const dbRequest = indexedDB.open(BROWSER_DATABASE_NAME, 1);

    dbRequest.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(BROWSER_DATABASE_TOKEN_TABLE)) {
        const objectStore = db.createObjectStore(BROWSER_DATABASE_TOKEN_TABLE, { keyPath: 'id' });
        objectStore.createIndex("authToken", "authToken", { unique: false });
      }
    };

    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([BROWSER_DATABASE_TOKEN_TABLE], 'readonly');
      const objectStore = transaction.objectStore(BROWSER_DATABASE_TOKEN_TABLE);
      const request = objectStore.get('authToken');

      request.onsuccess = (event) => {
        if (request.result) {
          this.setState({ isAuthenticated: true });
          this.props.reLogin(request.result.value);
        }
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.errorCode);
      };
    };

    dbRequest.onerror = function (event) {
      console.error("IndexedDB error:", event.target.errorCode);
    };

    // Video Background
    // document.querySelector('.ui.video').video();
    const graph = document.createElement('script');
    graph.src = '/scripts/animation.js';
    document.body.appendChild(graph);

    console.debug('[SENSEMAKER:UI]', 'SensemakerUI mounted.');

    // Fetch configuration status if we already have a token
    if (this.props.token) {
      this.fetchConfigurationStatus();
    } else {
      // If we don't have a token, we can't check configuration status, so stop loading
      console.debug('[SENSEMAKER:UI]', 'No token available, stopping configuration loading...');
      this.setState({ configurationLoading: false });
    }
  }

  componentDidUpdate (prevProps) {
    // Fetch configuration status when token becomes available
    if (!prevProps.token && this.props.token) {
      console.debug('[SENSEMAKER:UI]', 'Token became available, fetching configuration status...');
      this.setState({ configurationLoading: true });
      this.fetchConfigurationStatus();
    }

    // Stop configuration loading if token is lost
    if (prevProps.token && !this.props.token) {
      console.debug('[SENSEMAKER:UI]', 'Token lost, stopping configuration loading...');
      this.setState({ configurationLoading: false });
    }
  }

  componentWillUnmount () {
    // Clean up bridge connection
    if (this.bridge) {
      this.bridge.stop();
    }
  }

  render () {
    const { modalLogOut, loggedOut } = this.state;
    const { auth, login, register, error, onLoginSuccess, onRegisterSuccess } = this.props;

    const isLocal = window.location.protocol === 'file:';
    const basename = isLocal && window.location.pathname.includes('index.html')
      ? window.location.pathname
      : undefined;

    return (
      <sensemaker-interface id={this.id} class='fabric-site body'>
        <canvas id='video-background' className='ui video background' />
        <fabric-container id='react-application'>{/* TODO: render string here */}</fabric-container>
        <fabric-react-component id='sensemaker-application' style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {(!this.props.auth || this.props.auth.loading) ? (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Loader active inline="centered" size='huge' />
            </div>
          ) : (
            <BrowserRouter basename={basename}>
              {(!this.props.auth || !this.props.auth.isAuthenticated) ? (
                <Routes>
                  <Route path='/' element={<FrontPage login={login} error={error} onLoginSuccess={onLoginSuccess} createInquiry={this.props.createInquiry} inquiries={this.props.inquiries} />} />
                  <Route path='/inquiries' element={<InquiriesHome login={login} error={error} onLoginSuccess={onLoginSuccess} createInquiry={this.props.createInquiry} inquiries={this.props.inquiries} />} />
                  <Route path='/invitations/:id' element={<InvitationView {...this.props} />} />
                  <Route path='/features' element={<FeaturesHome />} />
                  <Route path='/sessions' element={<LoginPage login={login} error={error} onLoginSuccess={onLoginSuccess} />} />
                  <Route path='/contracts/terms-of-use' element={<TermsOfUse onAgreeSuccess={onLoginSuccess} fetchContract={this.props.fetchContract} />} />
                  <Route path='*' element={<NotFound />} />
                </Routes>
              ) : (this.props.auth && !this.props.auth.isCompliant) ? (
                <TermsOfUseModal
                  {...this.props}
                  auth={this.props.auth}
                  signContract={this.props.signContract}
                  logout={this.props.logout}
                  isCompliant={this.props.isCompliant}
                />
              ) : (this.props.auth && this.props.auth.isAdmin && this.state.configurationLoading) ? (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Loader active inline="centered" size='huge' />
                </div>
              ) : (this.props.auth && this.props.auth.isAdmin && !this.state.configurationLoading && !this.state.isConfigured) ? (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Onboarding
                    ref={this.onboardingRef}
                    autoOpen={false}
                    auth={this.props.auth}
                    onConfigurationComplete={this.handleConfigurationComplete}
                    bridge={this.bridge}
                  />
                  <div style={{ marginTop: '2em', textAlign: 'center' }}>
                    <p>You must first configure this node before you can use it.</p>
                    <Button color='green' icon labelPosition='right' onClick={this.handleOpenConfiguration}>
                      Configure Node <Icon name='right chevron' />
                    </Button>
                  </div>
                </div>
              ) : (this.props.auth && this.state.configurationLoading) ? (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Loader active inline="centered" size='huge' />
                </div>
              ) : (this.props.auth && !this.state.configurationLoading && !this.state.isConfigured) ? (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <p>This node has not yet been configured.  Ask the node operator to complete the setup process.</p>
                </div>
              ) : (
                <Dashboard
                  auth={this.props.auth}
                  onLogoutSuccess={this.handleLogout}
                  onMessageSuccess={this.handleMessageSuccess}
                  responseCapture={this.handleMessageSuccess}
                  createTask={this.props.createTask}
                  fetchContract={this.props.fetchContract}
                  fetchConversation={this.props.fetchConversation}
                  fetchConversations={this.props.fetchConversations}
                  fetchTasks={this.props.fetchTasks}
                  fetchAdminStats={this.props.fetchAdminStats}
                  handleConversationSubmit={this.handleConversationSubmit}
                  register={this.props.register}
                  resetChat={this.props.resetChat}
                  submitMessage={this.props.submitMessage}
                  submitStreamingMessage={this.props.submitStreamingMessage}
                  contracts={this.props.contracts}
                  conversations={this.props.conversations}
                  conversation={this.props.conversation}
                  chat={this.props.chat}
                  uploadDocument={this.props.uploadDocument}
                  uploadFile={this.props.uploadFile}
                  isAdmin={this.props.auth && this.props.auth.isAdmin}
                  isCompliant={this.props.auth && this.props.auth.isCompliant}
                  bridge={this.bridge}
                  store={this.store}
                  {...this.props}
                />
              )}
              <Modal
                onClose={this.handleModalClose}
                open={modalLogOut}
                size='mini'>
                <Modal.Header centered>Log Out of {BRAND_NAME}?</Modal.Header>
                <Modal.Content>
                  <Modal.Description>
                    {!loggedOut ? (
                      <Header as='h4'>Are you sure you want to log out?</Header>
                    ) : (
                      <Header as='h5' className='center aligned'>You have been logged out.<br /><br />Returning to the home page...</Header>
                    )}
                  </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                  {!loggedOut && (
                    <Button.Group>
                      <Button
                        content='Cancel'
                        icon='close'
                        onClick={this.handleModalClose}
                        labelPosition='right'
                        size='small'
                        secondary
                      />
                      <Button
                        content='Log out'
                        icon='log out'
                        onClick={this.handleLogoutSuccess}
                        labelPosition='right'
                        size='small'
                        primary
                      />
                    </Button.Group>
                  )}
                </Modal.Actions>
              </Modal>
            </BrowserRouter>
          )}
        </fabric-react-component>
      </sensemaker-interface>
    )
  }

  _getHTML () {
    const component = this.render();
    return renderToString(component);
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTMLFragment () {
    return this._toHTML();
  }

  toHTML () {
    return this.applicationString;
  }
}

module.exports = SensemakerUI;
