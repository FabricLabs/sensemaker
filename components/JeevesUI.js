'use strict';

// Dependencies
const React = require('react');
const { renderToString } = require('react-dom/server');
const {
  BrowserRouter,
  useNavigate
} = require('react-router-dom');

// Components
const Splash = require('./Splash');
const Dashboard = require('./Dashboard');
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

  render () {
    return (
      <jeeves-ui id={this.id} class="fabric-site">
        <fabric-container id="react-application"></fabric-container>
        <fabric-react-component id='jeeves-application'>
          <BrowserRouter>
            {this.props.isAuthenticated ? (
              <Dashboard
                onLogoutSuccess={this.handleLogoutSuccess}
                onMessageSuccess={this.handleMessageSuccess}
                fetchConversation={this.props.fetchConversation}
                fetchConversations={this.props.fetchConversations}
                fetchAdminStats={this.props.fetchAdminStats}
                handleConversationSubmit={this.handleConversationSubmit}
                submitMessage={this.props.submitMessage}
                conversations={this.props.conversations}
                conversation={this.props.conversation}
                chat={this.props.chat}
                {...this.props}
              />
            ) : (
              <Splash
                onLoginSuccess={this.handleLoginSuccess}
                onRegisterSuccess={this.handleRegisterSuccess}
                login={this.props.login}
                register={this.props.register}
                error={this.props.error}
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

function Application (props) {
  return <JeevesUI {...props} />;
}

module.exports = Application;
