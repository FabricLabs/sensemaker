'use strict';

// Dependencies
const React = require('react');
const { useLocation } = require('react-router-dom');

const {
  Card,
  Header,
  Segment
} = require('semantic-ui-react');

const QueryForm = require('./QueryForm');

class Home extends React.Component {
  componentDidUpdate (prevProps) {
    if (this.props.location?.key !== prevProps.location?.key) {
      // console.debug('[!!!]', 'location changed:', this.props.location, '!==', prevProps.location);
      this.setState({
        chat: {
          message: null,
          messages: []
        },
        message: null
      });
    }
  }

  render () {
    return (
      <sensemaker-home class='fade-in' style={{ marginRight: '1em' }}>
        <Segment fluid>
          <Header as='h1'>Welcome home, <abbr>{this.props.auth.username}</abbr>.</Header>
          <p>You have <strong>{this.props.unreadMessageCount || 0}</strong> unread messages.</p>
        </Segment>
        <QueryForm
          fetchConversations={this.props.fetchConversations}
          getMessages={this.props.getMessages}
          submitMessage={this.props.submitMessage}
          onMessageSuccess={this.props.onMessageSuccess}
          regenAnswer={this.props.regenAnswer}
          resetChat={this.props.resetChat}
          chat={this.props.chat}
          placeholder='Ask me anything...'
          includeFeed={false}
          getMessageInformation={this.props.getMessageInformation}
          resetInformationSidebar={this.props.resetInformationSidebar}
          messageInfo={this.props.messageInfo}
          thumbsUp={this.props.thumbsUp}
          thumbsDown={this.props.thumbsDown}
        />
        {/* <Header as='h4'>You can try&hellip;</Header>
        <Card.Group>
          <Card>
            <Card.Content>Cite 10 interesting cases related to the <Dropdown value="the 4th" /> amendment.</Card.Content>
          </Card>
        </Card.Group> */}
      </sensemaker-home>
    );
  }
}

function HomeWithLocation (props) {
  const location = useLocation();
  return <Home {...props} location={location} />;
}

module.exports = HomeWithLocation;
