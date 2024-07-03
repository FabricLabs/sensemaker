'use strict';

// Dependencies
const React = require('react');
const { Link, Navigate, Route, Routes, Switch, useLocation, useParams, useNavigate } = require('react-router-dom');
const { ToastContainer, toast, Slide } = require('react-toastify');
const { helpMessageToastEmitter, helpMessageSound } = require('../functions/toastifyProps.js')

// const LoadingBar = require('react-top-loading-bar');

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
  ENABLE_CHANGELOG,
  ENABLE_CONVERSATION_SIDEBAR,
  USER_HINT_TIME_MS,
  USER_MENU_HOVER_TIME_MS
} = require('../constants');

// Components
const Home = require('./Home');
const ContractHome = require('./ContractHome');
const Library = require('./Library');
const CaseHome = require('./CaseHome');
const CaseView = require('./CaseView');
const CourtHome = require('./CourtHome');
const CourtView = require('./CourtView');
const JudgeHome = require('./JudgeHome');
const JurisdictionHome = require('./JurisdictionHome');
const StatuteHome = require('./StatuteHome');
const OpinionHome = require('./OpinionHome');
const DocumentDrafter = require('./DocumentDrafter');
const DocumentHome = require('./DocumentHome');
const DocumentView = require('./DocumentView');
const DocumentNewChat = require('./DocumentNewChat');
const ReporterHome = require('./ReporterHome');
const ReporterView = require('./ReporterView');
const PeopleHome = require('./PeopleHome');
const VolumeHome = require('./VolumeHome');
const Workspaces = require('./Workspaces');
const Conversations = require('./Conversations');
const ConversationsList = require('./ConversationsList');
const LibraryList = require('./LibraryList');
const MattersHome = require('./MattersHome');
const MattersNew = require('./MattersNew');
const MattersList = require('./MattersList');
const MatterNewChat = require('./MatterNewChat');
const MatterView = require('./MatterView');
const UploadHome = require('./UploadHome');
const UserView = require('./UserView');
const Changelog = require('./Changelog');
const Room = require('./Room');
const Settings = require('./Settings');
const AdminSettings = require('./AdminSettings');
const TermsOfUse = require('./TermsOfUse');
const InformationSidebar = require('./InformationSidebar');
const FeedbackBox = require('./FeedbackBox');
const HelpBox = require('./HelpBox');

// Fabric Bridge
const Bridge = require('./Bridge');

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
        openMatters: false,
        openLibrary: true,
        openConversations: false,
        openSectionBar: false,
        helpBoxOpen: false,
        helpConversationUpdate: 0, //this value is used to tell the help admin chat which conversation got a new message from user (from bridge), to update the conversation

        //iformation Sidebar states
        informationSidebarOpen: false,
        checkingMessageID: 0,
        documentSection: false,
        documentInfo: null,
        documentSections: null, //these are the actual sections from a specific document
        matterTitle: '',
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

  componentDidMount() {
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

  // componentDidUpdate(prevProps) {
  //   const {help} = this.props;
  //   if (prevProps.help != help) {
  //     if(help.conversation && help.conversations.length > 0){

  //     }
  //   }
  // }

  componentDidUpdate(prevProps) {
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

  //========= Sidebar Functions ==========//

  //closes the right panel, informationSidebar and resets its states
  toggleInformationSidebar = () => {
    this.setState({
      informationSidebarOpen: false,
      checkingMessageID: null,
      documentSection: false,
      documentInfo: null,
      matterTitle: '',
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
      matterTitle: '',
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

  // triggers when a document from a matter is clicked to display
  documentInfoSidebar = (documentInfo, documentSections, matterTitle) => {
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
        matterTitle: matterTitle,
      });
    } else {
      this.toggleInformationSidebar();
    }
    this.resetInformationSidebar();
  }

  //this is the handler that sets which section is opened in the section bar in the left
  handleMenuItemClick = (menu) => {
    const newState = {
      openMatters: false,
      openLibrary: false,
      openConversations: false,
    };

    // Update the state based on the menu item clicked
    switch (menu) {
      case 'home':
        this.setState({ openSectionBar: false });
        this.props.resetChat();
        break;
      case 'matters':
        if (this.state.openMatters && this.state.openSectionBar) {
          this.setState({ openSectionBar: false });
        } else {
          newState.openMatters = true;
          this.setState({ openSectionBar: true });
          this.props.resetChat();
        }
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
    const { id, isAdmin } = this.props.auth;
    const sound = new Audio(helpMessageSound);

    if (id == action.creator) {
      if (action.type == 'HelpMsgAdmin') {
        this.props.fetchHelpConversations();
        if (this.state.helpBoxOpen) {
          this.props.fetchHelpMessages(action.conversation_id);
        }
        //emit toast for user
        sound.play().catch((error) => { console.error('Failed to play sound: ', error); });
        toast('You have a message from an assistant!', helpMessageToastEmitter);
      }
      if (action.type == 'IngestFile') {
        if (action.completed) {
          toast(
            <p>
              Your file <b>{action.filename}</b> has been Ingested!.
            </p>,
            helpMessageToastEmitter);
        }
        this.props.fetchFiles();
      }
      if (action.type == 'IngestDocument' && isAdmin) {
        toast(
          <p>
            Your document {action.title} has been Ingested, you can check it
            <b><a href={`${window.location.protocol}//${window.location.hostname}:${window.location.port}/documents/${action.fabric_id}`}> Here</a></b>
          </p>,
          helpMessageToastEmitter);
      }
    }

    if (action.type == 'HelpMsgUser' && isAdmin) {
      this.setState({ helpConversationUpdate: action.conversation_id });
      this.props.fetchAdminHelpConversations();
      //emit toast for admin
      if (this.props.location.pathname !== '/settings/admin') {
        sound.play().catch((error) => { console.error('Failed to play sound: ', error); });
        toast(`An user sent a message asking for assistance`, helpMessageToastEmitter);
      }
    }

    if (action.type == 'takenJob') {
      this.props.lastJobTaken(action.job);
      if (isAdmin) {
        this.props.syncRedisQueue();
      }
    }
    if (action.type == 'completedJob') {
      this.props.lastJobCompleted(action.job);
      if (isAdmin) {
        this.props.syncRedisQueue();
      }
    }
  }

  captureFileUpload = (action) => {
    toast('a file has finishing uploading', helpMessageToastEmitter);
  }

  //====================================================//

  render() {
    // const {location, params, navigate} = this.props;
    const USER_IS_ADMIN = this.props.auth.isAdmin || false;
    const USER_IS_ALPHA = this.props.auth.isAlpha || false;
    const USER_IS_BETA = this.props.auth.isBeta || false;

    // const USER_IS_ADMIN = true;
    // const USER_IS_ALPHA = true;
    // const USER_IS_BETA = true;
    const {
      openSectionBar,
      resetInformationSidebar,
      checkingMessageID,
      thumbsUpClicked,
      thumbsDownClicked,
      documentSection,
      documentInfo,
      documentSections,
      matterTitle,
      informationSidebarOpen,
      openLibrary,
      openMatters,
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
      marginLeft: openSectionBar ? '1em' : 'calc(-300px + 1em)',
      transition: 'margin-left 0.5s ease-in-out',
      maxHeight: '97vh',
    };

    return (
      <jeeves-dashboard style={{ height: '100%' }} className='fade-in'>
        {/* <LoadingBar color="#f11946" progress={this.state.progress} /> */}
        {/* <Joyride steps={this.state.steps} /> */}
        {/* <div id="sidebar" attached="bottom" style={{ overflow: 'hidden', borderRadius: 0, height: '100vh', backgroundColor: '#eee' }}> */}
        <div attached="bottom" style={{ overflowX: 'hidden', borderRadius: 0, height: '100vh', backgroundColor: '#ffffff', display: 'flex' }}>
          {/* Small sidebar to the left, with the icons, always visible */}
          <Sidebar as={Menu} id="main-sidebar" animation='overlay' icon='labeled' inverted vertical visible size='huge' style={{ overflow: 'hidden' }} onClick={() => { this.toggleInformationSidebar(); this.closeHelpBox(); }}>
            <div>
              <Menu.Item as={Link} to="/" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }} onClick={() => this.props.resetChat()}>
                <Image src="/images/novo-cat-white.svg" style={{ height: 'auto', width: '75%', verticalAlign: 'top' }} />
              </Menu.Item>
              <Menu.Item as={Link} to="/" onClick={() => this.handleMenuItemClick('home')}>
                <Icon name='home' size='large' />
                <p className='icon-label'>Home</p>
              </Menu.Item>
              {(USER_IS_BETA || USER_IS_ALPHA || USER_IS_ADMIN) && (
                <Popup
                  mouseEnterDelay={USER_HINT_TIME_MS}
                  position='right center'
                  trigger={(
                    <Menu.Item as={Link} to='/matters' onClick={() => this.handleMenuItemClick('matters')} className='expand-menu'>
                      <div className='col-center'>
                        <Icon name='gavel' size='large' />
                        <p className='icon-label'>Matters</p>
                      </div>
                      <div className='expand-icon'>
                        <Icon name={(openSectionBar && openMatters) ? 'left chevron' : 'right chevron'} size='small' />
                      </div>
                    </Menu.Item>
                  )}>
                  <Popup.Content>
                    <p>Upload notes, files, and more to give context to a matter</p>
                  </Popup.Content>
                </Popup>
              )}
              {ENABLE_CONVERSATION_SIDEBAR && (
                <Menu.Item as={Link} to="/conversations" onClick={() => this.handleMenuItemClick('conversations')}>
                  <Icon name='comment alternate outline' size='large' />
                  <p className='icon-label'>Conversations</p>
                </Menu.Item>
              )}
              <Menu.Item onClick={() => { this.handleMenuItemClick('library'); this.props.fetchConversations(); }} className='expand-menu'>
                <div className='col-center'>
                  <Icon name='book' size='large' />
                  <p className='icon-label'>Library</p>
                </div>
                <div className='expand-icon'>
                  <Icon name={(openSectionBar && openLibrary) ? 'left chevron' : 'right chevron'} size='small' />
                </div>
              </Menu.Item>
              {ENABLE_CHANGELOG && (
                <Menu.Item as={Link} to='/updates'>
                  <Icon name='announcement' size='large' />
                  <p className='icon-label'>Updates</p>
                </Menu.Item>
              )}
              {/* USER_IS_ADMIN && (
                <Menu.Item as='a' onClick={() => this.handleMenuItemClick('library')}>
                <Icon name='lab' size='large' />
                <p className='icon-label'>Lab</p>
              </Menu.Item>
              ) */}
            </div>
            <div style={{ flexGrow: 1 }}></div> {/* Spacer */}
            {/* {!this.state.openSectionBar && (
              <div className='expand-sidebar-arrow'>
                <Icon id='expand-sidebar-icon' name='caret right' size='large' white style={{ cursor: 'pointer' }} onClick={() => this.setState({ openSectionBar: true })} />
              </div>
            )} */}
            <div>
              {(this.props.auth.isAdmin) ? (
                <Menu.Item as={Link} to="/settings/admin" id='adminItem'>
                  <Icon name='key' size='large' />
                  <p className='icon-label'>Admin</p>
                </Menu.Item>) : null}
              <div className='settings-menu-container'>
                <Menu.Item as={Link} to="/settings" id='settingsItem'>
                  <Icon name='cog' size='large' />
                  <p className='icon-label'>Settings</p>
                </Menu.Item>
                <Menu.Item as={Link} onClick={this.handleLogout} id='logoutItem'>
                  <Icon name='log out' size='large' />
                  <p className='icon-label'>Log Out</p>
                </Menu.Item>
              </div>
            </div>
          </Sidebar>

          {/*SectionBar: bigger left sidebar that opens when we click on some of the sections */}
          <Sidebar as={Menu} animation='overlay' id="collapse-sidebar" icon='labeled' inverted vertical visible={openSectionBar} style={sidebarStyle} size='huge' onClick={() => { this.toggleInformationSidebar(); this.closeHelpBox(); }}>
            <div className='collapse-sidebar-arrow'>
              <Icon name='caret left' size='large' white style={{ cursor: 'pointer' }} onClick={() => this.setState({ openSectionBar: false })} />
            </div>
            <Menu.Item as={Link} to="/" style={{ paddingBottom: '0em', marginTop: '-1.5em' }}
              onClick={() => { this.setState({ openSectionBar: false }); this.props.resetChat() }}>
              <Header className='dashboard-header'>
                <div>
                  <div>
                    <Popup trigger={<Icon name='help' size='tiny' className='dashboard-help' />}>
                      <Popup.Header>Need Help?</Popup.Header>
                      <Popup.Content>
                        <p>Send us an email: <a href="mailto:support@jeeves.dev">support@trynovo.com</a></p>
                      </Popup.Content>
                    </Popup>
                    <Image src="/images/novo-text-white.svg" style={{ height: 'auto', width: '45%', verticalAlign: 'top' }} />
                  </div>
                  <div style={{ marginTop: '0.5em' }}>
                    <Popup trigger={<Icon name='circle' color='green' size='tiny' />}>
                      <Popup.Content>disconnected</Popup.Content>
                    </Popup>
                    <Popup trigger={<Label color='black' style={{ borderColor: 'transparent', backgroundColor: 'transparent' }}>{RELEASE_NAME}</Label>}>
                      <Popup.Content>{RELEASE_DESCRIPTION}</Popup.Content>
                    </Popup>
                  </div>
                </div>
              </Header>
            </Menu.Item>
            {this.state.openConversations && (
              <section className='fade-in'>
                <ConversationsList
                  resetChat={this.props.resetChat}
                  fetchConversations={this.props.fetchConversations}
                  auth={this.props.auth}
                  conversations={this.props.conversations}
                />
              </section>
            )}
            {this.state.openLibrary && (
              <section className='fade-in'>
                <LibraryList
                  resetChat={this.props.resetChat}
                  fetchConversations={this.props.fetchConversations}
                  auth={this.props.auth}
                  conversations={this.props.conversations}
                  searchGlobal={this.props.searchGlobal}
                  search={this.props.search}
                />
              </section>
            )}
            {this.state.openMatters && (
              <section className='fade-in'>
                <MattersList
                  matters={this.props.matters}
                  fetchMatters={this.props.fetchMatters}
                />
              </section>
            )}
            <div style={{ flexGrow: 1 }}></div> {/* Spacer */}
            <section>
              <Menu.Item style={{ borderBottom: 0 }}>
                <Bridge responseCapture={this.responseCapture} />
                <p style={{ marginTop: '2em' }}><small className="subtle">&copy; 2024 Legal Tools &amp; Technology, Inc.</small></p>
                {this.state.debug && <p><Label><strong>Status:</strong> {this.props.status || 'disconnected'}</Label></p>}
              </Menu.Item>
            </section>
          </Sidebar>

          <Container fluid style={containerStyle} onClick={() => this.closeSidebars()}>
            {this.state.debug ? (
              <div>
                <strong><code>isAdmin</code>:</strong> <span>{(this.props.isAdmin) ? 'yes' : 'no'}</span><br />
                <strong><code>isCompliant</code>:</strong> <span>{(this.props.isCompliant) ? 'yes' : 'no'}</span><br />
                <strong><code>auth</code>:</strong> <code>{(this.props.auth) ? JSON.stringify(this.props.auth, null, '  ') : 'undefined'}</code>
                {/* <strong><code>state.auth.isAdmin</code></strong> <span>{this.state.auth.isAdmin}</span>
                <strong><code>state.auth.isCompliant</code></strong> <span>{this.state.auth.isCompliant}</span> */}
              </div>
            ) : null}
            {this.state.isLoading ? null : (
              <Routes>
                <Route path="*" element={<Navigate to='/' replace />} />
                <Route path="/" element={
                  <Home
                    auth={this.props.auth}
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
                  />
                } />
                <Route path='/settings/library' element={<Library />} />
                <Route path="/updates" element={<Changelog />} />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/cases/:id" element={<CaseView fetchCase={this.props.fetchCase} cases={this.props.cases} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} fetchConversations={this.props.fetchConversations} onMessageSuccess={this.props.onMessageSuccess} resetChat={this.props.resetChat} chat={this.props.chat} regenAnswer={this.props.regenAnswer} getMessageInformation={this.props.getMessageInformation} resetInformationSidebar={this.resetInformationSidebar} messageInfo={this.messageInfo} thumbsUp={this.thumbsUp} thumbsDown={this.thumbsDown} />} />
                <Route path="/cases" element={<CaseHome cases={this.props.cases} fetchCases={this.props.fetchCases} searchCase={this.props.searchCase} chat={this.props.chat} resetChat={this.props.resetChat} getMessageInformation={this.props.getMessageInformation} />} />
                <Route path="/courts" element={<CourtHome courts={this.props.courts} fetchCourts={this.props.fetchCourts} searchCourt={this.props.searchCourt} fetchCourtsByJurisdiction={this.props.fetchCourtsByJurisdiction} jurisdictions={this.props.jurisdictions} fetchJurisdictions={this.props.fetchJurisdictions} chat={this.props.chat} />} />
                <Route path="/courts/:slug" element={<CourtView courts={this.props.courts} fetchCourt={this.props.fetchCourt} fetchCourts={this.props.fetchCourts} chat={this.props.chat} />} />
                {/**
                 * TODO: Add routes for judges, opinions, documents, people, reporters, jurisdictions, and volumes
                 * - [ ] Judges
                 * - [ ] Opinions
                 * - [ ] Documents
                 * - [ ] People
                 * - [ ] Volumes
                 * - [ ] Resolutions
                 */}
                <Route path="/statutes" element={<StatuteHome statutes={this.props.statutes} fetchStatutes={this.props.fetchStatutes} chat={this.props.chat} />} />
                <Route path="/judges" element={<JudgeHome judges={this.props.judges} fetchJudges={this.props.fetchJudges} chat={this.props.chat} />} />
                <Route path="/opinions" element={<OpinionHome opinions={this.props.opinions} fetchOpinions={this.props.fetchOpinions} chat={this.props.chat} />} />
                <Route path="/documents" element={<DocumentHome documents={this.props.documents} uploadDocument={this.props.uploadDocument} fetchDocuments={this.props.fetchDocuments} searchDocument={this.props.searchDocument} chat={this.props.chat} resetChat={this.props.resetChat} files={this.props.files} uploadFile={this.props.uploadFile} />} />
                <Route path="/documents/draft" element={<DocumentDrafter {...this.props} documents={this.props.documents} fetchDocument={this.props.fetchDocument} resetChat={this.props.resetChat} />} />
                <Route path="/documents/:fabricID" element={<DocumentView  {...this.props} documents={this.props.documents} fetchDocument={this.props.fetchDocument} resetChat={this.props.resetChat} />} />
                <Route path="/conversations/documents/:id" element={<DocumentNewChat {...this.props} documentInfoSidebar={this.documentInfoSidebar} resetInformationSidebar={this.resetInformationSidebar} messageInfo={this.messageInfo} thumbsUp={this.thumbsUp} thumbsDown={this.thumbsDown} />} />
                <Route path="/people" element={<PeopleHome people={this.props.people} fetchPeople={this.props.fetchPeople} chat={this.props.chat} />} />
                <Route path="/reporters" element={<ReporterHome reporters={this.props.reporters} fetchReporters={this.props.fetchReporters} searchReporter={this.props.searchReporter} chat={this.props.chat} />} />
                <Route path="/reporters/:id" element={<ReporterView reporters={this.props.reporters} fetchReporter={this.props.fetchReporter} />} />
                <Route path="/jurisdictions" element={<JurisdictionHome jurisdictions={this.props.jurisdictions} fetchJurisdictions={this.props.fetchJurisdictions} chat={this.props.chat} />} />
                <Route path="/volumes" element={<VolumeHome volumes={this.props.volumes} fetchVolumes={this.props.fetchVolumes} chat={this.props.chat} />} />
                <Route path="/conversations/:id" element={<Room conversation={this.props.conversation} conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} fetchConversation={this.props.fetchConversation} chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} getMessageInformation={this.props.getMessageInformation} conversationTitleEdit={this.props.conversationTitleEdit} resetInformationSidebar={this.resetInformationSidebar} messageInfo={this.messageInfo} thumbsUp={this.thumbsUp} thumbsDown={this.thumbsDown} documentInfoSidebar={this.documentInfoSidebar} documents={this.props.documents} fetchDocument={this.props.fetchDocument} fetchDocumentSections={this.props.fetchDocumentSections} />} />
                <Route path="/conversations" element={<Conversations conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} onMessageSuccess={this.props.onMessageSuccess} chat={this.props.chat} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} auth={this.props.auth} getMessageInformation={this.props.getMessageInformation} resetInformationSidebar={this.resetInformationSidebar} messageInfo={this.messageInfo} thumbsUp={this.thumbsUp} thumbsDown={this.thumbsDown} />} />
                <Route path="/matters" element={<MattersHome {...this.props} conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} onMessageSuccess={this.props.onMessageSuccess} chat={this.props.chat} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} auth={this.props.auth} getMessageInformation={this.props.getMessageInformation} />} />
                <Route path="/matters/new" element={<MattersNew fetchCourts={this.props.fetchCourts} fetchCourtsByJurisdiction={this.props.fetchCourtsByJurisdiction} fetchJurisdictions={this.props.fetchJurisdictions} jurisdictions={this.props.jurisdictions} courts={this.props.courts} matters={this.props.matters} createMatter={this.props.createMatter} />} />
                <Route path="/matters/:id" element={<MatterView fetchCourtsByJurisdiction={this.props.fetchCourtsByJurisdiction} fetchCourt={this.props.fetchCourt} fetchJurisdiction={this.props.fetchJurisdiction} fetchJurisdictions={this.props.fetchJurisdictions} jurisdictions={this.props.jurisdictions} courts={this.props.courts} fetchCourtById={this.props.fetchCourtById} matters={this.props.matters} fetchMatter={this.props.fetchMatter} fetchMatterConversations={this.props.fetchMatterConversations} matterConversations={this.props.matterConversations} addContext={this.props.addContext} removeFile={this.props.removeFile} removeNote={this.props.removeNote} editMatter={this.props.editMatter} conversations={this.props.conversations} fetchMatterFiles={this.props.fetchMatterFiles} fetchMatterNotes={this.props.fetchMatterNotes} auth={this.props.auth} documentInfoSidebar={this.documentInfoSidebar} files={this.props.files} />} />
                <Route path="/conversations/new/:matterID" element={<MatterNewChat {...this.props} />} />
                <Route path="/uploads" element={<UploadHome {...this.props} />} />
                <Route path="/users/:username" element={<UserView {...this.props} />} />
                {/* TODO: fix these routes */}
                {/* /settings/admin should render the overview */}
                {/* /settings/admin#users should load the user tab */}
                <Route path="/settings/admin/Overview" element={<AdminSettings {...this.props} activeIndex={0} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path="/settings/admin/Settings" element={<AdminSettings {...this.props} activeIndex={1} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path="/settings/admin/Users" element={<AdminSettings {...this.props} activeIndex={2} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path="/settings/admin/Growth" element={<AdminSettings {...this.props} activeIndex={3} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path="/settings/admin/Conversations" element={<AdminSettings {...this.props} activeIndex={4} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path="/settings/admin/Services" element={<AdminSettings {...this.props} activeIndex={5} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path="/settings/admin/Design" element={<AdminSettings {...this.props} activeIndex={6} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                {/* END TODO */}
                <Route path="/settings/admin" element={<AdminSettings {...this.props} activeIndex={0} helpConversationUpdate={this.state.helpConversationUpdate} fetchAdminStats={this.props.fetchAdminStats} resetHelpUpdated={() => this.setState({ helpConversationUpdate: 0 })} />} />
                <Route path="/settings" element={<Settings {...this.props} auth={this.props.auth} login={this.props.login} />} />
                <Route path="/contracts" element={<ContractHome {...this.props} fetchContract={this.props.fetchContract} fetchContracts={this.props.fetchContracts} />} />
                <Route path="/contracts/terms-of-use" element={<TermsOfUse {...this.props} fetchContract={this.props.fetchContract} />} />
              </Routes>
            )}
          </Container>
        </div>
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

        {/* <FeedbackBox
          open={this.state.helpBoxOpen}
          toggleHelpBox={this.toggleHelpBox}
          feedbackSection={true}
          sendFeedback={this.props.sendFeedback}
          feedback={this.props.feedback}
        /> */}
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
          matterTitle={matterTitle}
          onClick={() => { this.setState({ openSectionBar: false }); this.closeHelpBox(); }}
        />

        <ToastContainer />
      </jeeves-dashboard>
    );
  }
}

function dashboard(props) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  return <Dashboard {...{ location, navigate, params }} {...props} />
}

module.exports = dashboard;
