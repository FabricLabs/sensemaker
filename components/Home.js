'use strict';

// Dependencies
const React = require('react');
const { useLocation } = require('react-router-dom');

const {
  Card,
  Header
} = require('semantic-ui-react');

const QueryForm = require('./QueryForm');

class Home extends React.Component {
  componentDidUpdate (prevProps) {
    if (this.props.location?.key !== prevProps.location?.key) {
      console.debug('[!!!]', 'location changed:', this.props.location, '!==', prevProps.location);
      this.setState({
        chat: {
          message: null
        },
        message: null
      });
    }
  }

  render () {
    return (
      <jeeves-home class="fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column'}}>
        <QueryForm
          fetchConversations={this.props.fetchConversations}
          getMessages={this.props.getMessages}
          submitMessage={this.props.submitMessage}
          onMessageSuccess={this.props.onMessageSuccess}
          resetChat={this.props.resetChat}
          chat={this.props.chat}
          placeholder="Ask me anything..."
        />
      </jeeves-home>
    );
  }
}

function HomeWithLocation (props) {
  const location = useLocation();
  return <Home {...props} location={location} />;
}

module.exports = HomeWithLocation;
