const React = require('react');

const {
  Card,
  Header
} = require('semantic-ui-react');

const QueryForm = require('./QueryForm');

class JeevesHome extends React.Component {
  render () {
    return (
      <jeeves-home class="fade-in">
        <QueryForm
          fetchConversations={this.props.fetchConversations}
          getMessages={this.props.getMessages}
          submitMessage={this.props.submitMessage}
          onMessageSuccess={this.props.onMessageSuccess}
          chat={this.props.chat}
          placeholder="Ask me anything..."
        />
      </jeeves-home>
    );
  }
}

module.exports = JeevesHome;
