'use strict';

// Dependencies
const React = require('react');
const { BrowserRouter } = require('react-router-dom');
const { renderToString } = require('react-dom/server');

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
          'Authorization': `Bearer ${this.props.token}`, // Assuming you store token in Redux state
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success) {
        this.props.fetchConversations(); // Fetch new conversation list after posting a message
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
                fetchConversations={this.props.fetchConversations}
                handleConversationSubmit={this.handleConversationSubmit}
              />
            ) : (
              <Splash
                onLoginSuccess={this.handleLoginSuccess}
                login={this.props.login} // Pass login as a prop
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

module.exports = JeevesUI;
