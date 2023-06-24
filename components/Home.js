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
          submitMessage={this.props.submitMessage}
          onMessageSuccess={this.props.onMessageSuccess}
        />
        {/* <jeeves-conversations-recent>
          <Header>Recent Conversations</Header>
        </jeeves-conversations-recent> */}
      </jeeves-home>
    );
  }
}

module.exports = JeevesHome;
