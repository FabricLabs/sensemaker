'use strict';

// Dependencies
const React = require('react');
const { Link, useLocation } = require('react-router-dom');

const {
  Card,
  Header,
  Segment
} = require('semantic-ui-react');

const Clock = require('./Clock');
const QueryForm = require('./QueryForm');

class Home extends React.Component {
  componentDidMount () {
    // Retrieve Conversations
    this.props.fetchConversations();
  }

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
    const { conversations } = this.props;

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
          includeAttachments={true}
          includeFeed={false}
          getMessageInformation={this.props.getMessageInformation}
          resetInformationSidebar={this.props.resetInformationSidebar}
          messageInfo={this.props.messageInfo}
          thumbsUp={this.props.thumbsUp}
          thumbsDown={this.props.thumbsDown}
          uploadDocument={this.props.uploadDocument}
          uploadFile={this.props.uploadFile}
        />
        {(conversations && conversations.length) ? (
          <Segment fluid>
            <h3>Recently</h3>
            <Card.Group fluid>
              <Card as={Link} to={'/conversations/' + conversations[0].slug}>
                <Card.Content>
                  <Card.Header>{conversations[0].title}</Card.Header>
                  <Card.Description style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{conversations[0].summary}</Card.Description>
                </Card.Content>
              </Card>
              <Card as={Link} to='/conversations'>
                <Card.Content>
                  <Card.Header>Explore History &raquo;</Card.Header>
                  <Card.Description></Card.Description>
                </Card.Content>
              </Card>
            </Card.Group>
          </Segment>
        ) : null}
        <Clock />
      </sensemaker-home>
    );
  }
}

function HomeWithLocation (props) {
  const location = useLocation();
  return <Home {...props} location={location} />;
}

module.exports = HomeWithLocation;
