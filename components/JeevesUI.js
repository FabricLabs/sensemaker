'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { BrowserRouter } = require('react-router-dom');

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
      isAuthenticated: false
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
      <BrowserRouter>
        <fabric-react-component id='jeeves-application'>
          {this.state.isAuthenticated ? <Dashboard onLogoutSuccess={this.handleLogoutSuccess} /> : <Splash onLoginSuccess={this.handleLoginSuccess} />}
        </fabric-react-component>
      </BrowserRouter>
    )
  }

  _getHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = JeevesUI;
