'use strict';

// Dependencies
const React = require('react');
const { renderToString } = require('react-dom/server');
const {
  BrowserRouter,
  useNavigate,
  Navigate
} = require('react-router-dom');
const {loginSuccess} = require('../actions/authActions');

// Components
const Splash = require('./Splash');
const Dashboard = require('./Dashboard');
const TermsOfUseModal = require('./TermsOfUseModal');
const Waitlist = require('./Waitlist');

/**
 * The Jeeves UI.
 */
class JeevesUI extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      isLoading: true,
      isLoggingOut: false
    }
  }

  handleLoginSuccess = () => {
    console.log('setting isAuthenticated = true ...');
    this.setState({ isAuthenticated: true });
  }

  handleMessageSuccess = (result) => {
    console.log('message success! result:', result);
    this.setState({ incomingMessage: result });
  }

  handleRegisterSuccess = () => {
    console.log('registered = true ...');
    this.setState({ registered: true });
  }

  handleLogoutSuccess = () => {
    console.log('setting isAuthenticated = false ...');

    this.setState({
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false
    });

    window.location.reload();
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
  componentDidMount(){
    const session = JSON.parse(localStorage.getItem('authSession'));
    if(session){

      console.log(session);
      this.setState({ isAuthenticated: true });
      this.props.loggedIn(session);
      
    }

  }

  render () {
    
    return (
      <jeeves-ui id={this.id} class="fabric-site">
        <fabric-container id="react-application"></fabric-container>
        <fabric-react-component id='jeeves-application' style={{ height: '100vh', display: 'flex', flexDirection: 'column'}}>
          <BrowserRouter>
            {!this.props.isAuthenticated ? (
              <Splash
                onLoginSuccess={this.handleLoginSuccess}
                onRegisterSuccess={this.handleRegisterSuccess}
                login={this.props.login}
                register={this.props.register}
                error={this.props.error}
              />
            ) : !this.props.auth.isCompliant ? (
              <TermsOfUseModal
                {...this.props}
                auth={this.props.auth}
                signContract={this.props.signContract}
                logout={this.props.logout}
                isCompliant={this.props.isCompliant}
                />
            ) : (
              <Dashboard
                auth={this.props.auth}
                onLogoutSuccess={this.handleLogoutSuccess}
                onMessageSuccess={this.handleMessageSuccess}
                fetchContract={this.props.fetchContract}
                fetchConversation={this.props.fetchConversation}
                fetchConversations={this.props.fetchConversations}
                fetchAdminStats={this.props.fetchAdminStats}
                handleConversationSubmit={this.handleConversationSubmit}
                register={this.props.register}
                resetChat={this.props.resetChat}
                submitMessage={this.props.submitMessage}
                contracts={this.props.contracts}
                conversations={this.props.conversations}
                conversation={this.props.conversation}
                chat={this.props.chat}
                isAdmin={this.props.auth.isAdmin}
                isCompliant={this.props.auth.isCompliant}
                {...this.props}
              />
            )}
          </BrowserRouter>
        </fabric-react-component>
      </jeeves-ui>
    )
  }

  _getHTML () {
    const component = this.render();
    return renderToString(component);
  }
}

module.exports = JeevesUI;
