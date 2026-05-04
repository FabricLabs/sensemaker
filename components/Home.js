'use strict';

const {
  ENABLE_BITCOIN,
  BRAND_NAME
} = require('../constants');

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
  Label,
  List,
  Message,
  Popup,
  Segment,
  Table
} = require('semantic-ui-react');

// Hub Components
const ActivityStream = require('@fabric/hub/components/ActivityStream');

// Local Components
const AnnouncementList = require('./AnnouncementList');
const Clock = require('./Clock');
const QueryForm = require('./QueryForm');
const UserProfileSection = require('./UserProfileSection');
const ProfileEditModal = require('./ProfileEditModal');
const TopBar = require('./TopBar');
const AlertBell = require('./AlertBell');
const HelpModal = require('./HelpModal');
const Onboarding = require('./Onboarding');
const DonateToHostModal = require('./DonateToHostModal');

const formatBitcoin = require('../functions/formatBitcoin');

/** Titles sometimes store agent boilerplate; prefer a readable label for cards. */
function conversationDisplayTitle (c) {
  if (!c) return 'Conversation';
  const title = c.title != null && String(c.title).trim();
  if (!title) return 'Conversation';
  if (/^no conversation occurred previously$/i.test(title)) {
    const summary = c.summary != null && String(c.summary).trim();
    if (summary && !/^no conversation occurred/i.test(summary)) {
      return summary.length > 72 ? `${summary.slice(0, 69)}…` : summary;
    }
    return 'Recent chat';
  }
  return title;
}

/** Tooltip / preview text when `summary` is empty (avoids blank Semantic UI Popup). */
function conversationPreviewText (c) {
  if (!c) return 'No summary yet.';
  const summary = c.summary != null && String(c.summary).trim();
  if (summary) {
    const title = c.title != null && String(c.title).trim();
    if (/^no conversation occurred previously$/i.test(title) && summary.length > 200) {
      return `${summary.slice(0, 197)}…`;
    }
    return summary;
  }
  const title = c.title != null && String(c.title).trim();
  if (title) return title;
  return 'No summary yet.';
}

class Home extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      isProfileModalOpen: false,
      isPopupOpen: false,
      alerts: [],
      triggers: [],
      unconfirmedBalance: '0.00000000'
    };
  }

  componentDidMount () {
    // Retrieve Conversations
    this.props.fetchConversations();
    this.props.fetchAnnouncements();
    this.fetchAlerts();
    this.fetchTriggers();
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

  fetchAlerts = async () => {
    try {
      const response = await fetch('/alerts');
      const data = await response.json();
      this.setState({ alerts: data });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  fetchTriggers = async () => {
    try {
      const response = await fetch('/triggers');
      const data = await response.json();
      this.setState({ triggers: data });
    } catch (error) {
      console.error('Error fetching triggers:', error);
    }
  };

  handleProfileClick = () => {
    this.setState({ isProfileModalOpen: true });
  };

  handleProfileModalClose = () => {
    this.setState({ isProfileModalOpen: false });
  };

  handlePopupOpen = () => {
    this.setState({ isPopupOpen: true });
  };

  handlePopupClose = () => {
    this.setState({ isPopupOpen: false });
  };

  handleAlertClick = (alert) => {
    // Handle alert click - could navigate to alert details or mark as read
    console.log('Alert clicked:', alert);
  };

  render () {
    const { auth, announcements, bitcoinBalance, conversations } = this.props;
    const { isPopupOpen, isProfileModalOpen, donateModalOpen, hostWorker, alerts, triggers, unconfirmedBalance } = this.state;
    const USER_IS_ADMIN = this.props.auth && this.props.auth.isAdmin || false;
    const USER_IS_ALPHA = this.props.auth && this.props.auth.isAlpha || this.props.auth.isAdmin || false;
    const USER_IS_BETA = this.props.auth && this.props.auth.isBeta || this.props.auth.isAdmin || false;
    const token = this.props.auth && this.props.auth.token;
    const bitcoinPopup = (
      <div className='fade-in' style={{ padding: '0.5em', maxWidth: '22rem' }}>
        <p style={{ marginBottom: '0.65em', fontSize: '0.9em', lineHeight: 1.45 }}>
          One host node ({BRAND_NAME}) — balance and queue below apply to this instance only.
        </p>
        <Button
          as={Link}
          to="/services/bitcoin#deposit"
          color="green"
          fluid
          size="small"
          icon
          labelPosition='right'
          onClick={this.handlePopupClose}
          style={{ marginBottom: '0.5em' }}
        >
          <Icon name="download" />
          Deposit Bitcoin
        </Button>
        <Button
          as={Link}
          to="/services/bitcoin#send"
          color="blue"
          fluid
          size="small"
          icon
          labelPosition='right'
          onClick={this.handlePopupClose}
          disabled={!bitcoinBalance || parseFloat(bitcoinBalance) === 0}
          style={{ marginBottom: '0.5em' }}
        >
          <Icon name='paper plane outline' />
          Send Bitcoin
        </Button>
        <Button
          as={Link}
          to="/services/bitcoin#withdraw"
          color="black"
          fluid
          size="small"
          icon
          labelPosition='right'
          onClick={this.handlePopupClose}
          disabled={!bitcoinBalance || parseFloat(bitcoinBalance) === 0}
          style={{ marginBottom: '0.5em' }}
        >
          <Icon name="right chevron" />
          Withdraw
        </Button>
        <Button
          color="orange"
          fluid
          size="small"
          icon
          labelPosition="right"
          onClick={() => {
            this.handlePopupClose();
            this.setState({ donateModalOpen: true });
          }}
        >
          <Icon name="heart" />
          Donate (playnet)
        </Button>
      </div>
    );

    return (
      <sensemaker-home class='fade-in' style={{ marginRight: '1em' }}>
        <style>
          {`
            @media (max-width: 768px) {
              .ui.stackable.grid > .column:not(.row) {
                padding-right: 0 !important;
              }
            }
          `}
        </style>
        {/* <TopBar {...this.props} /> */}
        {/* <UserProfileSection {...this.props} /> */}
        {/* <Icon name='user circle' style={{ marginRight: '1em', cursor: 'pointer' }} onClick={this.handleProfileClick} /> */}
        <Card fluid style={{ marginTop: 0}}>
          <Card.Content>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1em' }}>
              <Header as='h1' style={{ margin: 0 }}>Welcome home, <Popup content={
                  <div>
                    <p>This is your public identity.</p>
                    <Button size='tiny' onClick={this.handleProfileClick}>
                      <Icon name='edit' />
                      Edit Profile
                    </Button>
                  </div>
                }
                trigger={<abbr title="Your public identity">{String(this.props.auth.username || '').trim()}</abbr>}
                position='bottom center'
                mouseEnterDelay={250}
                animation='fade'
                hoverable
                />.</Header>
              <div style={{ display: 'flex', gap: '0.5em' }}>
                {/* <HelpModal
                  navigate={this.props.navigate}
                  onStartTour={() => this.props.tourGuide?.startTour()}
                  style={{ height: '100%' }}
                />
                <Onboarding style={{ height: '100%' }} /> */}
                {ENABLE_BITCOIN && USER_IS_ALPHA && <Link to='/services/bitcoin/transactions' style={{ color: 'black' }}>
                  <Popup
                    content={bitcoinPopup}
                    hoverable
                    trigger={
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.92em', gap: '0.25em' }}>
                        <Icon name='bitcoin' />
                        {bitcoinBalance || '0.00000000'} BTC
                      </span>
                    }
                  />
                </Link>}
                <Link to='/alerts' style={{ color: 'black' }}><AlertBell {...this.props} alerts={alerts} triggers={triggers} onAlertClick={this.handleAlertClick} /></Link>
              </div>
            </div>
            <p>You have <strong>{this.props.unreadMessageCount || 0}</strong> unread messages.</p>
            {hostWorker && (
              <Message size="small" info style={{ marginTop: '0.75em', marginBottom: 0 }}>
                <Icon name="server" />
                Host <strong>{hostWorker.nodeName || BRAND_NAME}</strong>
                {' — '}work queue depth <strong>{hostWorker.queueDepth != null ? hostWorker.queueDepth : '—'}</strong>
                {hostWorker.busy ? ' (worker busy)' : ''}
                {hostWorker.playnetBitcoinReady === false ? ' · playnet RPC offline' : ''}
              </Message>
            )}
          </Card.Content>
        </Card>
        <DonateToHostModal
          open={donateModalOpen}
          onClose={() => this.setState({ donateModalOpen: false })}
          token={token}
          onSuccess={() => {
            if (typeof this.props.fetchBitcoinStats === 'function') {
              this.props.fetchBitcoinStats().catch(() => {});
            }
          }}
        />
        <AnnouncementList announcements={announcements?.announcements} />
        <QueryForm
          fetchConversations={this.props.fetchConversations}
          getMessages={this.props.getMessages}
          submitMessage={this.props.submitMessage}
          submitStreamingMessage={this.props.submitStreamingMessage}
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
          bridge={this.props.bridge}
          style={{ marginBottom: 0 }}
        />
        <Grid columns={3} stackable equal style={{ display: 'flex', alignItems: 'stretch', marginTop: '-1em', marginLeft: 0 }}>
          <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
          {(conversations && conversations.length) ? (
              <Card key={conversations[0].slug} fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }} as={Link} to={'/conversations/' + conversations[0].slug}>
                  <Popup
                    content={conversationDisplayTitle(conversations[0])}
                    trigger={
                      <Card.Header style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: 'inherit' }}>{conversationDisplayTitle(conversations[0])}</Card.Header>
                    }
                    position='top left'
                  />
                  <Popup
                    content={conversationPreviewText(conversations[0])}
                    trigger={
                      <Card.Description style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: 'inherit' }}>
                        {conversationPreviewText(conversations[0])}
                      </Card.Description>
                    }
                    position='bottom left'
                  />
                </Card.Content>
                <Button attached='bottom' color='black' as={Link} to={'/conversations/' + conversations[0].slug}>Resume &raquo;</Button>
              </Card>
            )  : null}
          </Grid.Column>
          <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
            {(conversations && conversations.length > 1) ? (
              <Card key={conversations[1].slug} fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }} as={Link} to={'/conversations/' + conversations[1].slug}>
                  <Popup
                    content={conversationDisplayTitle(conversations[1])}
                    trigger={
                      <Card.Header style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: 'inherit' }}>{conversationDisplayTitle(conversations[1])}</Card.Header>
                    }
                    position='top left'
                  />
                  <Popup
                    content={conversationPreviewText(conversations[1])}
                    trigger={
                      <Card.Description style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: 'inherit' }}>
                        {conversationPreviewText(conversations[1])}
                      </Card.Description>
                    }
                    position='bottom left'
                  />
                </Card.Content>
                <Button attached='bottom' color='black' as={Link} to={'/conversations/' + conversations[1].slug}>Resume &raquo;</Button>
              </Card>
            )  : null}
          </Grid.Column>
          <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
            {(conversations && conversations.length > 2) ? (
              <Card fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }}>
                  <Card.Header>Recently...</Card.Header>
                  <List>
                    {conversations.slice(2, 5).map((conversation) => (
                      <List.Item key={conversation.slug}>
                        <List.Icon name='chevron right' />
                        <List.Content>
                          <Popup
                            content={conversationPreviewText(conversation)}
                            trigger={
                              <List.Header
                                title={conversationPreviewText(conversation)}
                                as={Link}
                                to={`/conversations/${conversation.slug}`}
                              >
                                {conversationDisplayTitle(conversation)}
                              </List.Header>
                            }
                            position='right center'
                          />
                        </List.Content>
                      </List.Item>
                    ))}
                  </List>
                </Card.Content>
                <Button attached='bottom' color='black' as={Link} to='/conversations'>Explore History &raquo;</Button>
              </Card>
            ) : null}
          </Grid.Column>
        </Grid>
        <p style={{ color: '#888', fontSize: '0.9em', marginTop: '0.75em', marginBottom: '0.25em', lineHeight: 1.45 }}>
          The live feed below lists Fabric / hub events (peers, documents, blocks). Chat threads are in the row above — it can look quiet here even when you have conversations.
        </p>
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
