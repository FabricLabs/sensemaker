'use strict';

// Dependencies
const React = require('react');
const { Link, useLocation } = require('react-router-dom');

const marked = require('marked');

// Components
// Semantic UI
const {
  Button,
  Card,
  Grid,
  Header,
  Icon,
  List,
  Message,
  Segment,
  Popup
} = require('semantic-ui-react');

// Hub Components
const ActivityStream = require('@fabric/hub/components/ActivityStream');

// Local Components
const AnnouncementList = require('./AnnouncementList');
const Clock = require('./Clock');
const QueryForm = require('./QueryForm');
const UserProfileSection = require('./UserProfileSection');
const ProfileEditModal = require('./ProfileEditModal');

class Home extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      isProfileModalOpen: false
    };
  }

  componentDidMount () {
    // Retrieve Conversations
    this.props.fetchConversations();
    this.props.fetchAnnouncements();
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

  handleProfileClick = () => {
    this.setState({ isProfileModalOpen: true });
  };

  handleProfileModalClose = () => {
    this.setState({ isProfileModalOpen: false });
  };

  render () {
    const { auth, announcements, conversations } = this.props;
    const { isPopupOpen, isProfileModalOpen } = this.state;
    return (
      <sensemaker-home class='fade-in' style={{ marginRight: '1em' }}>
        {/* <UserProfileSection {...this.props} /> */}
        {/* <Icon name='user circle' style={{ marginRight: '1em', cursor: 'pointer' }} onClick={this.handleProfileClick} /> */}
        <Segment fluid="true">
          <Header as='h1'>Welcome home, <abbr>{this.props.auth.username}</abbr>.</Header>
          <p>You have <strong>{this.props.unreadMessageCount || 0}</strong> unread messages.</p>
        </Segment>
        <AnnouncementList announcements={announcements?.announcements} />
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
          takeFocus={true}
          thumbsUp={this.props.thumbsUp}
          thumbsDown={this.props.thumbsDown}
          uploadDocument={this.props.uploadDocument}
          uploadFile={this.props.uploadFile}
          style={{ marginBottom: 0 }}
        />
        <Grid columns={3} stackable equal style={{ display: 'flex', alignItems: 'stretch', marginTop: '-1em', marginLeft: 0 }}>
          <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
          {(conversations && conversations.length) ? (
              <Card key={conversations[0].slug} as={Link} to={'/conversations/' + conversations[0].slug} fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }}>
                  <Popup
                    content={conversations[0].title}
                    trigger={
                      <Card.Header style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{conversations[0].title}</Card.Header>
                    }
                    position='top left'
                  />
                  <Popup
                    content={conversations[0].summary}
                    trigger={
                      <Card.Description style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{conversations[0].summary}</Card.Description>
                    }
                    position='bottom left'
                  />
                </Card.Content>
                <Button.Group attached='bottom' style={{ marginTop: 'auto' }}>
                  <Button color='black' as={Link} to={'/conversations/' + conversations[0].slug}>Resume &raquo;</Button>
                </Button.Group>
              </Card>
            )  : null}
          </Grid.Column>
          <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
            {(conversations && conversations.length > 1) ? (
              <Card key={conversations[1].slug} as={Link} to={'/conversations/' + conversations[1].slug} fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }}>
                  <Popup
                    content={conversations[1].title}
                    trigger={
                      <Card.Header style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{conversations[1].title}</Card.Header>
                    }
                    position='top left'
                  />
                  <Popup
                    content={conversations[1].summary}
                    trigger={
                      <Card.Description style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{conversations[1].summary}</Card.Description>
                    }
                    position='bottom left'
                  />
                </Card.Content>
                <Button.Group attached='bottom' style={{ marginTop: 'auto' }}>
                  <Button color='black' as={Link} to={'/conversations/' + conversations[1].slug}>Resume &raquo;</Button>
                </Button.Group>
              </Card>
            )  : null}
          </Grid.Column>
          <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
            {(conversations && conversations.length > 2) ? (
              <Card as={Link} to='/conversations' fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }}>
                  <Card.Header>Recently...</Card.Header>
                  <List>
                    {conversations.slice(2, 5).map((conversation) => (
                      <List.Item key={conversation.slug}>
                        <List.Icon name='chevron right' />
                        <List.Content>
                          <Popup
                            content={conversation.summary}
                            trigger={
                              <List.Header title={conversation.summary} as={Link} to={`/conversations/${conversation.slug}`}>{conversation.title}</List.Header>
                            }
                            position='right center'
                          />
                        </List.Content>
                      </List.Item>
                    ))}
                  </List>
                </Card.Content>
                <Button.Group attached='bottom' style={{ marginTop: 'auto' }}>
                  <Button color='black'>Explore History &raquo;</Button>
                </Button.Group>
              </Card>
            ) : null}
          </Grid.Column>
        </Grid>
        <ActivityStream
          includeHeader={false}
          api={this.props.api}
          fetchResource={this.props.fetchResource}
          {...this.props} 
        />
        <Clock style={{ position: 'fixed', bottom: '1em', right: '1em' }} />
        <ProfileEditModal
          open={isProfileModalOpen}
          onClose={this.handleProfileModalClose}
          auth={auth}
        />
      </sensemaker-home>
    );
  }
}

function HomeWithLocation (props) {
  const location = useLocation();
  return <Home {...props} location={location} />;
}

module.exports = HomeWithLocation;
