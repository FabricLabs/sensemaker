'use strict';

// Dependencies
const React = require('react');
const { BrowserRouter } = require('react-router-dom');
const { renderToString } = require('react-dom/server');

// Components
const Splash = require('./Splash');
const Dashboard = require('./Dashboard');

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

  render () {
    return (
      <jeeves-ui id={this.id} class="fabric-site">
        <fabric-container id="react-application"></fabric-container>
        <BrowserRouter>
          <fabric-react-component id='jeeves-application'>
            {this.state.isAuthenticated ? <Dashboard onLogoutSuccess={this.handleLogoutSuccess} /> : <Splash onLoginSuccess={this.handleLoginSuccess} />}
          </fabric-react-component>
        </BrowserRouter>
      </jeeves-ui>
    )
  }

  _getHTML () {
    const component = this.render();
    return renderToString(component);
  }
}

module.exports = JeevesUI;
