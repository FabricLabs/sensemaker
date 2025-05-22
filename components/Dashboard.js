'use strict';

// Dependencies
const React = require('react');
const {
  Link,
  Navigate,
  Route,
  Routes,
  useHistory,
  useLocation,
  useParams,
  useNavigate,
  Outlet
} = require('react-router-dom');

const {
  ToastContainer,
  toast
} = require('react-toastify');

const {
  helpMessageToastEmitter,
  helpMessageSound
} = require('../functions/toastifyProps');

// Semantic UI
const {
  Container,
  Header,
  Icon,
  Image,
  Label,
  Menu,
  Popup,
  Sidebar,
} = require('semantic-ui-react');

// Constants
const {
  BRAND_NAME,
  RELEASE_NAME,
  RELEASE_DESCRIPTION,
  ENABLE_AGENTS,
  ENABLE_ALERTS,
  ENABLE_CHANGELOG,
  ENABLE_CHAT,
  ENABLE_DOCUMENTS,
  ENABLE_FEEDBACK_BUTTON,
  ENABLE_GROUPS,
  ENABLE_JOBS,
  ENABLE_NETWORK,
  ENABLE_SOURCES,
  ENABLE_TASKS,
  ENABLE_UPLOADS,
  ENABLE_WALLET,
  USER_HINT_TIME_MS,
  USER_MENU_HOVER_TIME_MS
} = require('../constants');

// Components
const Home = require('./Home');
const AgentHome = require('./AgentHome');
const AgentView = require('./AgentView');
const AlertsBar = require('./AlertsBar');
const AlertsHome = require('./AlertsHome');
const FeaturesHome = require('./FeaturesHome');
const GroupHome = require('./GroupHome');
const GroupView = require('./GroupView');
const JobHome = require('./JobHome');
const NetworkHome = require('./NetworkHome');
const Library = require('./Library');
const ContractHome = require('./ContractHome');
const DocumentHome = require('./DocumentHome');
const DocumentView = require('./DocumentView');
const PeopleHome = require('./PeopleHome');
const Conversations = require('./Conversations');
const SourceHome = require('./SourceHome');
const SourceView = require('./SourceView');
const TaskHome = require('./TaskHome');
const TaskView = require('./TaskView');
const UploadHome = require('./UploadHome');
const UserView = require('./UserView');
const WalletHome = require('./WalletHome');
const Changelog = require('./Changelog');
const Room = require('./Room');
const Settings = require('./Settings');
const AdminSettings = require('./AdminSettings');
const TermsOfUse = require('./TermsOfUse');
const InformationSidebar = require('./InformationSidebar');
const FeedbackBox = require('./FeedbackBox');
const HelpBox = require('./HelpBox');
const GlobalChat = require('./Global');

// Fabric Bridge
const Bridge = require('./Bridge');

// Services
const BitcoinHome = require('./services/bitcoin/BitcoinHome');
const BitcoinBlockList = require('./services/bitcoin/BitcoinBlockList');
const BitcoinBlockView = require('./services/bitcoin/BitcoinBlockView');
const BitcoinTransactionList = require('./services/bitcoin/BitcoinTransactionList');
const BitcoinTransactionView = require('./services/bitcoin/BitcoinTransactionView');
const DiskHome = require('./services/DiskHome');
const DiskPath = require('./services/DiskPath');
const DiscordHome = require('./services/DiscordHome');
const DiscordChannel = require('./services/discord/DiscordChannel');
const DiscordChannels = require('./services/discord/DiscordChannelList');
const DiscordGuild = require('./services/discord/DiscordGuild');
const DiscordGuilds = require('./services/discord/DiscordGuildList');
const DiscordUser = require('./services/discord/DiscordUser');
const DiscordUsers = require('./services/discord/DiscordUserList');
const FabricHome = require('./services/FabricHome');
const GitHubHome = require('./services/GitHubHome');

/**
 * The main dashboard component.
 */
class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      debug: false,
      state: {
        loading: false,
        username: '(guest account)',
        search: '',
        sidebarCollapsed: false,
        sidebarVisible: true,
        progress: 0,
        isLoading: true,
        isLoggingOut: false,
        openLibrary: true,
        openConversations: false,
        openSectionBar: false,
        helpBoxOpen: false,
        helpConversationUpdate: 0,
        informationSidebarOpen: false,
        checkingMessageID: 0,
        documentSection: false,
        documentInfo: null,
        documentSections: null, //these are the actual sections from a specific document
        resetInformationSidebar: false,
        thumbsUpClicked: false,
        thumbsDownClicked: false,
        helpNotification: false,
        steps: [
          {
            target: '.my-first-step',
            content: 'This is my awesome feature!',
          },
          {
            target: '.my-other-step',
            content: 'This another awesome feature!',
          }
        ]
      }
    }, props);

    this.state = this.settings.state;
  }

  ref = () => {
    return React.createRef()
  }

  clickSelfIcon = () => {
    return (<Navigate to='/settings' />);
  }

  componentDidMount () {
    const { location, params, navigate } = this.props;
    const { isAdmin } = this.props.auth;
    // this.startProgress();

    // $('.ui.sidebar').sidebar();

    this.props.fetchConversations();
    this.props.fetchHelpConversations();

    // Simulate a loading delay
    setTimeout(() => {
      // this.completeProgress();
      this.setState({ isLoading: false });
    }, 250);

    if (isAdmin) {
      this.props.syncRedisQueue();
    }
  }

  componentDidUpdate (prevProps) {
    const { help } = this.props;
    if (prevProps.help != help) {
      if (help.conversations && help.conversations.length > 0) {
        // Check if any conversation matches the condition
        const hasUnreadAdminMessage = help.conversations.some(
          instance => instance.last_message.help_role === 'admin' && instance.last_message.is_read === 0
        );
        // Set helpNotification state based on the result
        this.setState({ helpNotification: hasUnreadAdminMessage });
      } else {
        // If there are no conversations, set helpNotification to false
        this.setState({ helpNotification: false });
      }
    }
  }

  handleLogout = () => {
    this.setState({
      loading: true,
      isLoggingOut: true
    });

    setTimeout(() => {
      this.props.onLogoutSuccess();
      this.setState({
        loading: false,
        isLoggingOut: false
      });
    }, 500);
  };

  // TODO: review and determine what to do with this function
  // handleSettings = () => {}

  startProgress = () => {
    this.intervalId = setInterval(() => {
      this.setState(prevState => ({
        progress: prevState.progress + 1,
      }), () => {
        if (this.state.progress >= 100) {
          this.completeProgress();
          this.setState({ isLoading: false });
          clearInterval(this.intervalId);
        } else {
          this.ref.current.continuousStart();
        }
      });
    }, 5);
  };

  completeProgress = () => {
    this.ref.current.complete();
  };

  handleSearchChange = (e) => {
    console.log('search change:', e);
    this.setState({ search: e.target.value });
  };

  toggleHelpBox = () => {
    if (!this.state.helpBoxOpen) {
      this.props.fetchHelpConversations();
    }
    this.setState({ helpNotification: false, });
    this.setState(prevState => ({
      helpBoxOpen: !prevState.helpBoxOpen,
    }));
  };

  //closes the right panel, informationSidebar and resets its states
  toggleInformationSidebar = () => {
    this.setState({
      informationSidebarOpen: false,
      checkingMessageID: null,
      documentSection: false,
      documentInfo: null,
      resetInformationSidebar: false,
      thumbsUpClicked: false,
      thumbsDownClicked: false,
    });
  };

  //closes left and right sidebars
  closeSidebars = () => {
    this.setState({ openSectionBar: false });
    this.closeHelpBox();
    if (this.state.informationSidebarOpen) {
      this.toggleInformationSidebar();
    }
  }

  //to handle the flag that resets the information in the informationSidebar
  resetInformationSidebar = () => {
    this.setState(prevState => ({ resetInformationSidebar: !prevState.resetInformationSidebar }));
  }

  //this one triggers when the "i" icon in a chat message is clicked
  messageInfo = (ID) => {
    let newState = {
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      checkingMessageID: ID,
      informationSidebarOpen: true,
      documentSection: false,
      documentInfo: null,
      openSectionBar: false,
    };

    // if sidebar is open and checkingMessageID === actual clicked message,
    // and none of thumbs was active, then closes sidebar (because it means you clicked "I"
    // icon twice for the same message)
    if (this.state.informationSidebarOpen && ID === this.state.checkingMessageID &&
      !this.state.thumbsUpClicked && !this.state.thumbsDownClicked) {
      newState.informationSidebarOpen = false;
    }

    this.setState(newState);
    this.resetInformationSidebar();
  }

  // thumbs up handler from a chat message
  thumbsUp = (ID) => {
    this.setState({ thumbsDownClicked: false, openSectionBar: false, });

    // if thumbsUp was clicked for this message already, close sidebar
    if (this.state.thumbsUpClicked && this.state.checkingMessageID === ID) {
      this.setState({
        informationSidebarOpen: false,
        thumbsUpClicked: false,
        thumbsDownClicked: false
      });
    } else {
      //else, open (or keep open) sidebar, and fix states
      this.setState({
        thumbsUpClicked: true,
        thumbsDownClicked: false,
        documentSection: false,
        documentInfo: null,
        openSectionBar: false,
        checkingMessageID: ID,
        informationSidebarOpen: true
      });

    }
    this.resetInformationSidebar();
  };

  // thumbs down handler from a chat message
  thumbsDown = (ID) => {
    this.setState({ thumbsUpClicked: false, openSectionBar: false, });
    // if thumbsDown was clicked for this message already, close sidebar
    if (this.state.thumbsDownClicked && this.state.checkingMessageID === ID) {
      this.setState({
        informationSidebarOpen: false,
        thumbsUpClicked: false,
        thumbsDownClicked: false
      });
    } else {
      //else, open (or keep open) sidebar, and fix states
      this.setState({
        thumbsUpClicked: false,
        thumbsDownClicked: true,
        documentSection: false,
        documentInfo: null,
        openSectionBar: false,
        checkingMessageID: ID,
        informationSidebarOpen: true
      });
    }
    this.resetInformationSidebar();
  };

  // triggers when a document is clicked to display
  documentInfoSidebar = (documentInfo, documentSections) => {
    this.setState({ openSectionBar: false });
    if (this.state.documentInfo !== documentInfo) {
      this.setState({
        informationSidebarOpen: true,
        checkingMessageID: null,
        thumbsUpClicked: false,
        thumbsDownClicked: false,
        documentSection: true,
        documentInfo: documentInfo,
        documentSections: documentSections,
      });
    } else {
      this.toggleInformationSidebar();
    }
    this.resetInformationSidebar();
  }

  //this is the handler that sets which section is opened in the section bar in the left
  handleMenuItemClick = (menu) => {
    const newState = {
      openLibrary: false,
      openConversations: false,
    };

    // Update the state based on the menu item clicked
    switch (menu) {
      case 'home':
        this.setState({ openSectionBar: false });
        this.props.resetChat();
        break;
      case 'conversations':
        if (this.state.openConversations && this.state.openSectionBar) {
          this.setState({ openSectionBar: false });
        } else {
          newState.openConversations = true;
          this.setState({ openSectionBar: true });
          this.props.resetChat();
        }
        break;
      case 'library':
        if (this.state.openLibrary && this.state.openSectionBar) {
          this.setState({ openSectionBar: false });
          newState.openLibrary = true;
        } else {
          newState.openLibrary = true;
          this.setState({ openSectionBar: true });
          if (!this.state.openLibrary) {
            this.props.resetChat();
          }
        }
        break;
      default:
        console.error('Unknown menu item');
        return;
    }

    // Set the new state
    this.setState(newState);
  };

  closeHelpBox = () => {
    this.setState({ helpBoxOpen: false });
  }

  responseCapture = (action) => {
    if (this.props.responseCapture) {
      this.props.responseCapture(action);
    }
  }

  captureFileUpload = (action) => {
    toast('a file has finishing uploading', helpMessageToastEmitter);
  }

  render () {
    // TODO: prompt user for external links replacing current application
    // const { navigate } = this.props;
    const USER_IS_ADMIN = this.props.auth && this.props.auth.isAdmin || false;
    const USER_IS_ALPHA = this.props.auth && this.props.auth.isAlpha || this.props.auth.isAdmin || false;
    const USER_IS_BETA = this.props.auth && this.props.auth.isBeta || this.props.auth.isAdmin || false;
    const {
      openSectionBar,
      resetInformationSidebar,
      checkingMessageID,
      thumbsUpClicked,
      thumbsDownClicked,
      documentSection,
      documentInfo,
      documentSections,
      informationSidebarOpen,
      openLibrary,
    } = this.state;

    // const sidebarStyle = this.state.sidebarCollapsed ? { width: 'auto', position: 'relative' } : {position: 'relative'};
    const sidebarStyle = {
      minWidth: '300px',
      maxWidth: '300px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto',
      scrollbarGutter: 'stable both-edges',
    };

    const containerStyle = {
      margin: '1em 1em 0 1em',
      marginLeft: 'calc(90px + 1em)',
      transition: 'margin-left 0.5s ease-in-out',
      maxHeight: '97vh',
      width: 'calc(100% - 90px - 2em)', // Account for sidebar width and margins
    };

    return (
      <sensemaker-dashboard style={{ height: '100%' }}>
        {/* <LoadingBar color="#f11946" progress={this.state.progress} /> */}
        {/* <Joyride steps={this.state.steps} /> */}
        {/* <div id="sidebar" attached="bottom" style={{ overflow: 'hidden', borderRadius: 0, height: '100vh', backgroundColor: '#eee' }}> */}
        <div style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: '#ffffff'
        }}>
          <Sidebar className='fade-in' as={Menu} id='main-sidebar' animation='overlay' icon='labeled' inverted vertical visible size='huge' style={{ overflow: 'hidden' }} onClick={() => { this.toggleInformationSidebar(); this.closeHelpBox(); }}>
            <div>
              <Menu.Item as={Link} to='/' onClick={() => this.handleMenuItemClick('home')}>
                <Icon name='home' size='large' />
                <p className='icon-label'>Home</p>
              </Menu.Item>
              {ENABLE_TASKS && USER_IS_BETA && (
                <Menu.Item as={Link} to='/tasks' onClick={this.closeSidebars}>
                  <Icon name='tasks' size='large'/>
                  <p className='icon-label'>Tasks</p>
                </Menu.Item>
              )}
              {ENABLE_SOURCES && USER_IS_ADMIN && (
                <Menu.Item as={Link} to='/sources' onClick={this.closeSidebars}>
                  <Icon name='globe' size='large'/>
                  <p className='icon-label'>Sources</p>
                </Menu.Item>
              )}
              {ENABLE_CHAT && (
                // <Menu.Item as={Link} to='/conversations' onClick={() => this.handleMenuItemClick('conversations')} className='expand-menu'>
                <Menu.Item as={Link} to='/conversations' onClick={this.closeSidebars}>
                  <div className='col-center'>
                    <Icon name='comment alternate' size='large' />
                    <p className='icon-label'>Chat</p>
                  </div>
                  <div className='expand-icon'>
                    {(openSectionBar) ? null : <Icon name='right chevron' className='fade-in' size='small' />}
                  </div>
                </Menu.Item>
              )}
              {ENABLE_NETWORK && USER_IS_ADMIN && (
                <Menu.Item as={Link} to='/peers' onClick={this.closeSidebars}>
                  <Icon name='globe' size='large'/>
                  <p className='icon-label'>Network</p>
                </Menu.Item>
              )}
              {ENABLE_GROUPS && (USER_IS_ALPHA || USER_IS_ADMIN) && (
                <Menu.Item as={Link} to='/groups' onClick={this.closeSidebars}>
                  <Icon name='users' size='large'/>
                  <p className='icon-label'>Groups</p>
                </Menu.Item>
              )}
              {ENABLE_WALLET && USER_IS_ADMIN && (
                <Menu.Item as={Link} to='/keys' onClick={this.closeSidebars}>
                  <Icon name='bitcoin' size='large' />
                  <p className='icon-label'>Wallet</p>
                </Menu.Item>
              )}
              {ENABLE_DOCUMENTS && (USER_IS_ALPHA || USER_IS_ADMIN) && (
                <Menu.Item as={Link} to='/documents' onClick={this.closeSidebars}>
                  <Icon name='book' size='large'/>
                  <p className='icon-label'>Library</p>
                </Menu.Item>
              )}
              {ENABLE_JOBS && (
                <Menu.Item as={Link} to='/jobs' onClick={this.closeSidebars}>
                  <Icon name='tasks' size='large'/>
                  <p className='icon-label'>Jobs</p>
                </Menu.Item>
              )}
            </div>
            <div style={{ flexGrow: 1 }}></div> {/* Spacer */}
            <div>
              {ENABLE_CHANGELOG && (
                <Menu.Item as={Link} to='/updates' onClick={this.closeSidebars}>
                  <Icon name='announcement' size='large' />
                  <p className='icon-label'>News</p>
                </Menu.Item>
              )}
              {(this.props.auth && this.props.auth.isAdmin) ? (
                <Menu.Item as={Link} to="/settings/admin" id='adminItem' onClick={this.closeSidebars}>
                  <Icon name='key' size='large' />
                  <p className='icon-label'>Admin</p>
                </Menu.Item>) : null}
              <div className='settings-menu-container'>
                <Menu.Item as={Link} to="/settings" id='settingsItem' onClick={this.closeSidebars}>
                  <Icon name='cog' size='large' />
                  <p className='icon-label'>Settings</p>
                </Menu.Item>
              </div>
            </div>
          </Sidebar>
          <Container fluid style={{
            marginLeft: '0',
            padding: '1em',
            width: 'calc(100% - 90px)',
            height: '100vh',
            overflow: 'auto'
          }} onClick={this.closeSidebars}>
            {this.state.debug ? (
              <div>
                <strong><code>isAdmin</code>:</strong> <span>{(this.props.isAdmin) ? 'yes' : 'no'}</span><br />
                <strong><code>isCompliant</code>:</strong> <span>{(this.props.isCompliant) ? 'yes' : 'no'}</span><br />
                <strong><code>auth</code>:</strong> <code>{(this.props.auth) ? JSON.stringify(this.props.auth, null, '  ') : 'undefined'}</code>
              </div>
            ) : null}
            {this.state.isLoading ? null : (
              <Routes>
                {/* TODO: add a nice 404 page */}
                <Route path='*' element={<Navigate to='/' replace />} />
                <Route path='/' element={
                  <Home
                    api={this.props.api}
                    auth={this.props.auth}
                    conversations={this.props.conversations}
                    fetchConversations={this.props.fetchConversations}
                    getMessages={this.props.getMessages}
                    submitMessage={this.props.submitMessage}
                    regenAnswer={this.props.regenAnswer}
                    onMessageSuccess={this.props.onMessageSuccess}
                    resetChat={this.props.resetChat}
                    chat={this.props.chat}
                    getMessageInformation={this.props.getMessageInformation}
                    resetInformationSidebar={this.resetInformationSidebar}
                    messageInfo={this.messageInfo}
                    thumbsUp={this.thumbsUp}
                    thumbsDown={this.thumbsDown}
                    uploadFile={this.props.uploadFile}
                    uploadDocument={this.props.uploadDocument}
                    {...this.props}
                  />
                } />
                <Route path='/settings/library' element={<Library />} />
                <Route path='/updates' element={<Changelog {...this.props} />} />
                <Route path='/agents' element={<AgentHome {...this.props} />} />
                <Route path='/agents/:id' element={<AgentView {...this.props} />} />
                <Route path='/alerts' element={<AlertsHome {...this.props} />} />
                <Route path='/documents' element={<DocumentHome {...this.props} documents={this.props.documents} uploadDocument={this.props.uploadDocument} fetchDocuments={this.props.fetchDocuments} searchDocument={this.props.searchDocument} chat={this.props.chat} resetChat={this.props.resetChat} files={this.props.files} uploadFile={this.props.uploadFile} />} uploadDocument={this.props.uploadDocument} navigate={this.props.navigate} />
                <Route path='/documents/:fabricID' element={<DocumentView  {...this.props} documents={this.props.documents} fetchDocument={this.props.fetchDocument} resetChat={this.props.resetChat} />} />
                <Route path='/features' element={<FeaturesHome />} />
                <Route path='/people' element={<PeopleHome people={this.props.people} fetchPeople={this.props.fetchPeople} chat={this.props.chat} />} />
                <Route path='/conversations/:id' element={<Room conversation={this.props.conversation} conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} fetchConversation={this.props.fetchConversation} chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} getMessageInformation={this.props.getMessageInformation} conversationTitleEdit={this.props.conversationTitleEdit} resetInformationSidebar={this.resetInformationSidebar} messageInfo={this.messageInfo} thumbsUp={this.thumbsUp} thumbsDown={this.thumbsDown} documentInfoSidebar={this.documentInfoSidebar} documents={this.props.documents} fetchDocument={this.props.fetchDocument} fetchDocumentSections={this.props.fetchDocumentSections} />} />
                <Route path='/conversations' element={<Conversations users={this.props.users} conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} onMessageSuccess={this.props.onMessageSuccess} chat={this.props.chat} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} auth={this.props.auth} getMessageInformation={this.props.getMessageInformation} resetInformationSidebar={this.resetInformationSidebar} messageInfo={this.messageInfo} thumbsUp={this.thumbsUp} thumbsDown={this.thumbsDown} />} />
                <Route path='/groups' element={<GroupHome chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} fetchGroups={this.props.fetchGroups} createGroup={this.props.createGroup} {...this.props} />} />
                <Route path='/groups/:id' element={<GroupView chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} fetchGroups={this.props.fetchGroups} createGroup={this.props.createGroup} {...this.props} />} />
                <Route path='/sources' element={<SourceHome chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} fetchSources={this.props.fetchSources} createSource={this.props.createSource} createPeer={this.props.createPeer} fetchPeers={this.props.fetchPeers} {...this.props} />} />
                <Route path='/sources/:id' element={<SourceView chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} fetchSources={this.props.fetchSources} createSource={this.props.createSource} createPeer={this.props.createPeer} fetchPeers={this.props.fetchPeers} {...this.props} />} />
                <Route path='/tasks' element={<TaskHome {...this.props} chat={this.props.chat} fetchResponse={this.props.fetchResponse} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} getMessageInformation={this.props.getMessageInformation} tasks={this.props.tasks} fetchTasks={this.props.fetchTasks} createTask={this.props.createTask} updateTask={this.props.updateTask} />} />
                <Route path='/tasks/:id' element={<TaskView {...this.props} task={this.props.task} />} />
                <Route path='/uploads' element={<UploadHome {...this.props} />} />
                <Route path='/users/:username' element={<UserView username={this.props.username} biography={this.props.biography} fetchUser={this.props.fetchUser} {...this.props} />} />
                <Route path='/settings/admin' element={<AdminSettings {...this.props} activeIndex={0} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path='/settings' element={<Settings {...this.props} auth={this.props.auth} login={this.props.login} />} />
                <Route path='/keys' element={<WalletHome {...this.props} wallet={this.props.keys} auth={this.props.auth} login={this.props.login} />} />
                <Route path='/peers' element={<NetworkHome {...this.props} network={{ peers: [] }} />} />
                <Route path='/services/bitcoin' element={<BitcoinHome {...this.props} bitcoin={this.props.bitcoin} fetchBitcoinStats={this.props.fetchBitcoinStats} />} />
                <Route path='/services/bitcoin/blocks' element={<BitcoinBlockList {...this.props} bitcoin={this.props.bitcoin} fetchBitcoinStats={this.props.fetchBitcoinStats} />} />
                <Route path='/services/bitcoin/blocks/:blockhash' element={<BitcoinBlockView {...this.props} bitcoin={this.props.bitcoin} fetchBitcoinStats={this.props.fetchBitcoinStats} />} />
                <Route path='/services/bitcoin/transactions' element={<BitcoinTransactionList {...this.props} bitcoin={this.props.bitcoin} fetchBitcoinStats={this.props.fetchBitcoinStats} />} />
                <Route path='/services/bitcoin/transactions/:txhash' element={<BitcoinTransactionView {...this.props} bitcoin={this.props.bitcoin} fetchBitcoinStats={this.props.fetchBitcoinStats} />} />
                <Route path='/services/discord' element={<DiscordHome {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/channels' element={<DiscordChannels {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/channels/:id' element={<DiscordChannel {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/guilds' element={<DiscordGuilds {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/guilds/:id' element={<DiscordGuild {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/guilds/:id/channels' element={<DiscordGuild {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/guilds/:id/members' element={<DiscordGuild {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/users' element={<DiscordUsers {...this.props} discord={this.props.discord} />} />
                <Route path='/services/discord/users/:id' element={<DiscordUser {...this.props} discord={this.props.discord} />} />
                <Route path='/services/disk/:path' element={<DiskPath {...this.props} disk={this.props.disk} />} />
                <Route path='/services/disk' element={<DiskHome {...this.props} disk={this.props.disk} />} />
                <Route path='/services/fabric' element={<FabricHome {...this.props} fabric={this.props.fabric} />} />
                <Route path='/services/github' element={<GitHubHome {...this.props} />} />
                <Route path='/topics/global' element={<GlobalChat {...this.props} />} />
                <Route path='/contracts' element={<ContractHome {...this.props} fetchContract={this.props.fetchContract} fetchContracts={this.props.fetchContracts} />} />
                <Route path='/contracts/terms-of-use' element={<TermsOfUse {...this.props} fetchContract={this.props.fetchContract} />} />
                <Route path='/jobs' element={<JobHome {...this.props} />} />
              </Routes>
            )}
          </Container>
        </div>
        {ENABLE_FEEDBACK_BUTTON && (
          <div>
            <div id='feedback-button'>
              {this.state.helpNotification ?
                (<Icon
                  size='big'
                  // name='question circle outline'
                  name={this.state.helpBoxOpen ? 'close' : 'bell outline'}
                  className='red jiggle-animation'
                  onClick={() => this.toggleHelpBox()}
                />) :
                (<Icon
                  size='big'
                  // name='question circle outline'
                  name={this.state.helpBoxOpen ? 'close' : 'question circle outline'}
                  // id='feedback-button'
                  className='grey'
                  onClick={() => this.toggleHelpBox()}
                />)}
            </div>
            <FeedbackBox
              open={this.state.helpBoxOpen}
              toggleHelpBox={this.toggleHelpBox}
              feedbackSection={true}
              sendFeedback={this.props.sendFeedback}
              feedback={this.props.feedback}
            />
            <HelpBox
              open={this.state.helpBoxOpen}
              fetchHelpConversations={this.props.fetchHelpConversations}
              fetchHelpMessages={this.props.fetchHelpMessages}
              sendHelpMessage={this.props.sendHelpMessage}
              markMessagesRead={this.props.markMessagesRead}
              clearHelpMessages={this.props.clearHelpMessages}
              help={this.props.help}
              notification={this.state.helpNotification}
              stopNotification={() => this.setState({ helpNotification: false })}
            />
          </div>
        )}
        <InformationSidebar
          visible={informationSidebarOpen}
          toggleInformationSidebar={this.toggleInformationSidebar}
          resetInformationSidebar={resetInformationSidebar}
          checkingMessageID={checkingMessageID}
          thumbsUpClicked={thumbsUpClicked}
          thumbsDownClicked={thumbsDownClicked}
          documentSection={documentSection}
          documentInfo={documentInfo}
          documentSections={documentSections}
          onClick={() => { this.setState({ openSectionBar: false }); this.closeHelpBox(); }}
          message={this.props.chat?.messages?.find(m => m.id === checkingMessageID)}
        />
        <ToastContainer />
      </sensemaker-dashboard>
    );
  }
}

function dashboard (props) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  return <Dashboard {...{ location, navigate, params }} {...props} />
}

module.exports = dashboard;
