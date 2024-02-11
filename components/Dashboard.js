'use strict';

// Dependencies
const React = require('react');
const { Link, Navigate, Route, Routes, Switch } = require('react-router-dom');
// const LoadingBar = require('react-top-loading-bar');

// Semantic UI
const {
  Button,
  Card,
  Container,
  Header,
  Icon,
  Image,
  Label,
  Menu,
  Popup,
  Search,
  Segment,
  Sidebar,
  Progress,
} = require('semantic-ui-react');

const {
  BRAND_NAME,
  RELEASE_NAME,
  RELEASE_DESCRIPTION,
  ENABLE_MATTERS,
  ENABLE_CASE_SEARCH,
  ENABLE_COURT_SEARCH,
  ENABLE_JUDGE_SEARCH,
  ENABLE_OPINION_SEARCH,
  ENABLE_DOCUMENT_SEARCH,
  ENABLE_PERSON_SEARCH,
  ENABLE_JURISDICTION_SEARCH,
  ENABLE_REPORTER_SEARCH,
  ENABLE_STATUTE_SEARCH,
  ENABLE_VOLUME_SEARCH,
  ENABLE_LIBRARY
} = require('../constants');

// Components
const Home = require('./Home');
const CaseHome = require('./CaseHome');
const CaseView = require('./CaseView');
const CourtHome = require('./CourtHome');
const CourtView = require('./CourtView');
const JudgeHome = require('./JudgeHome');
const OpinionHome = require('./OpinionHome');
const DocumentHome = require('./DocumentHome');
const PeopleHome = require('./PeopleHome');
const VolumeHome = require('./VolumeHome');
const Workspaces = require('./Workspaces');
const Conversations = require('./Conversations');
const ConversationsList = require('./ConversationsList');
const MattersHome = require('./MattersHome');
const MattersNew = require('./MattersNew');
const MattersList = require('./MattersList');
const MatterChat = require('./MatterChat');
const MatterNewChat = require('./MatterNewChat');
const MatterView = require('./MatterView');
const Room = require('./Room');
const Settings = require('./Settings');
const AdminSettings = require('./AdminSettings');
const TermsOfUse = require('./TermsOfUse');

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
        openPlayground: true,
        openMatters: false,
        openLibrary: false,
        openSectionBar: false,
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
    // this.startProgress();

    // $('.ui.sidebar').sidebar();

    this.props.fetchConversations();

    // Simulate a loading delay
    setTimeout(() => {
      // this.completeProgress();
      this.setState({ isLoading: false });
    }, 250);
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

  handleSettings = () => {

  }

  handleSidebarToggle = () => {
    this.setState((prevState) => ({
      sidebarCollapsed: !prevState.sidebarCollapsed
    }));
  };

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

  toggleSidebar = (e) => {
    $('.ui.sidebar').sidebar('toggle');
  }

  handleMenuItemClick = (menu) => {
    const newState = {
      openPlayground: false,
      openMatters: false,
      openLibrary: false,
      openSectionBar: true, // This seems to be common across all clicks, so we set it true here
    };

    // Update the state based on the menu item clicked
    switch (menu) {
      case 'playground':
        newState.openPlayground = true;
        this.props.resetChat();
        break;
      case 'matters':
        newState.openMatters = true;
        break;
      case 'library':
        newState.openLibrary = true;
        break;
      default:
        console.error('Unknown menu item');
        return;
    }

    // Set the new state
    this.setState(newState);
  };

  render () {
    const { openSectionBar } = this.state;
    const USER_IS_ADMIN = this.props.auth.isBeta || false;
    const USER_IS_BETA = this.props.auth.isBeta || false;
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
    };

    return (
      <jeeves-dashboard style={{ height: '100%' }} className='fade-in'>
        {/* <LoadingBar color="#f11946" progress={this.state.progress} /> */}
        {/* <Joyride steps={this.state.steps} /> */}
        {/* <div id="sidebar" attached="bottom" style={{ overflow: 'hidden', borderRadius: 0, height: '100vh', backgroundColor: '#eee' }}> */}
        <div attached="bottom" style={{ overflow: 'hidden', borderRadius: 0, height: '100vh', backgroundColor: '#ffffff', display: 'flex' }}>
          <Sidebar as={Menu} id="main-sidebar" animation='overlay' icon='labeled' inverted vertical visible size='huge' style={{ overflow: 'hidden' }}>
            <div>
              <Menu.Item as={Link} to="/" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }} onClick={this.props.resetChat()}>
                <Image src="/images/novo-cat-white.svg" style={{ height: 'auto', width: '75%', verticalAlign: 'top' }} />
              </Menu.Item>
              <Menu.Item as={Link} to="/" onClick={() => this.handleMenuItemClick('playground')}>
                <Icon name='comment outline' size='large' />
                <p className='icon-label'>Playground</p>
              </Menu.Item>
              <Menu.Item as='a' onClick={() => this.handleMenuItemClick('matters')}>
                <Icon name='pencil' size='large' />
                <p className='icon-label'>Matters</p>
              </Menu.Item>
              <Menu.Item as='a' onClick={() => this.handleMenuItemClick('library')}>
                <Icon name='book' size='large' />
                <p className='icon-label'>Library</p>
              </Menu.Item>
            </div>
            <div style={{ flexGrow: 1 }}></div> {/* Spacer */}
            {!this.state.openSectionBar && (
              <div className='expand-sidebar-arrow'>
                <Icon id='expand-sidebar-icon' name='caret right' size='large' white style={{ cursor: 'pointer' }} onClick={() => this.setState({ openSectionBar: true })} />
              </div>
            )}


            <div>
              <Menu.Item as={Link} to="/settings">
                <Icon name='user circle' size='large' />
                <p className='icon-label'>Settings</p>
              </Menu.Item>
              {(this.props.auth.isAdmin) ? (
                <Menu.Item as={Link} to="/settings/admin">
                  <Icon name='cog' size='large' />
                  <p className='icon-label'>Admin</p>
                </Menu.Item>) : null}
              <Menu.Item as={Link} onClick={this.handleLogout}>
                <Icon name='log out' size='large' />
                <p className='icon-label'>Log Out</p>
              </Menu.Item>
            </div>
          </Sidebar>
          <Sidebar as={Menu} animation='overlay' icon='labeled' inverted vertical visible={openSectionBar} style={sidebarStyle} size='huge'>
            <div className='collapse-sidebar-arrow'>
              <Icon name='caret left' size='large' white style={{ cursor: 'pointer' }} onClick={() => this.setState({ openSectionBar: false })} />
            </div>
            <Menu.Item as={Link} to="/" style={{ paddingBottom: '0em', marginTop: '-1.5em' }} onClick={() => this.props.resetChat()}>
              <Header className='dashboard-header'>
                <div>
                  <div>
                    <Popup trigger={<Icon name='help' size='tiny' className='dashboard-help' />}>
                      <Popup.Header>Need Help?</Popup.Header>
                      <Popup.Content>
                        <p>Send us an email: <a href="mailto:support@jeeves.dev">support@trynovo.com</a></p>
                        {/* <p><strong>Call Chuck!</strong> +1 (d00) p00-d00p</p> */}
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
            {this.state.openPlayground && (
              <section className='fade-in'>
                <ConversationsList {...this.props} />
              </section>
            )}
            {this.state.openLibrary && (
              <section className='fade-in'>
                {/* <Menu.Item>
              <jeeves-search fluid disabled placeholder='Find...' className="ui disabled search" title='Search is disabled.'>
                <div className="ui icon fluid input">
                  <input disabled autoComplete="off" placeholder="Find..." type="text" tabIndex="0" className="prompt" value={this.state.search} onChange={this.handleSearchChange} />
                  <i aria-hidden="true" className="search icon"></i>
                </div>
              </jeeves-search>
            </Menu.Item> */}

                {/* <Menu.Item as={Link} to="/" onClick={() => this.props.resetChat()}>
                  <div><Icon name='home' /> {!this.state.sidebarCollapsed && 'Home'}</div>
                </Menu.Item> */}
                {ENABLE_STATUTE_SEARCH && (
                  <Menu.Item as={Link} to='/statues'>
                    <div><Icon name='user' /> {!this.state.sidebarCollapsed && 'Statutes'} <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {/* <Menu.Item as={Link} to="/conversations">
                  <div><Icon name='quote left' /> {!this.state.sidebarCollapsed && 'Conversations'} {this.state.conversationAlert ? <Label size='mini' color='red'>!</Label> : null}</div>
                </Menu.Item> */}
                {/* USER_IS_BETA && ENABLE_MATTERS && (
                  <Menu.Item as={Link} to='/matters'>
                    <div><Icon name='file' /> {!this.state.sidebarCollapsed && 'Matters'} <Label size='mini' color='blue'><code>beta</code></Label> <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                ) */}
                {USER_IS_BETA && ENABLE_DOCUMENT_SEARCH && (
                  <Menu.Item as={Link} to='/documents'>
                    <div><Icon name='book' /> {!this.state.sidebarCollapsed && 'Documents'} <Label size='mini' color='blue'><code>beta</code></Label> <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_ADMIN && ENABLE_JURISDICTION_SEARCH && (
                  <Menu.Item as={Link} to='/jurisdictions'>
                    <div><Icon name='users' /> {!this.state.sidebarCollapsed && 'Jurisdictions'} <Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_ADMIN && ENABLE_COURT_SEARCH && (
                  <Menu.Item as={Link} to='/courts'>
                    <div><Icon name='university' /> {!this.state.sidebarCollapsed && 'Courts'} <Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_BETA && ENABLE_CASE_SEARCH && (
                  <Menu.Item as={Link} to='/cases'>
                    <div><Icon name='briefcase' /> {!this.state.sidebarCollapsed && 'Cases'} <Label size='mini' color='blue'><code>beta</code></Label> <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_BETA && ENABLE_JUDGE_SEARCH && (
                  <Menu.Item as={Link} to='/judges'>
                    <div><Icon name='user' /> {!this.state.sidebarCollapsed && 'Judges'} <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_BETA && ENABLE_OPINION_SEARCH && (
                  <Menu.Item as={Link} to='/opinions'>
                    <div><Icon name='balance scale' /> {!this.state.sidebarCollapsed && 'Opinions'} <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_BETA && ENABLE_LIBRARY && (
                  <Menu.Item disabled>
                    <div>
                      <Icon name='book' />
                      {!this.state.sidebarCollapsed && 'Library'}
                      &nbsp;<Label size='mini' color='orange'>disabled</Label>
                    </div>
                  </Menu.Item>
                )}
                {USER_IS_BETA && ENABLE_PERSON_SEARCH && (
                  <Menu.Item as={Link} to='/people'>
                    <div><Icon name='users' /> {!this.state.sidebarCollapsed && 'People'} <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_BETA && ENABLE_REPORTER_SEARCH && (
                  <Menu.Item as={Link} to='/reporters'>
                    <div><Icon name='users' /> {!this.state.sidebarCollapsed && 'Reporters'} <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {USER_IS_BETA && ENABLE_VOLUME_SEARCH && (
                  <Menu.Item as={Link} to='/volumes'>
                    <div><Icon name='users' /> {!this.state.sidebarCollapsed && 'Volumes'} <Label size='mini' color='green'>New!</Label></div>
                  </Menu.Item>
                )}
                {/* <Menu.Item disabled>
              <div><Icon name='law' /> {!this.state.sidebarCollapsed && 'Resolutions'} <Label size='mini' color='blue'>coming soon</Label></div>
            </Menu.Item> */}
                {/* <Menu.Item disabled as={Link} to="/workspaces">
              <div><Icon name='users' /> {!this.state.sidebarCollapsed && 'Workspaces'} <Label size='mini' color='blue'>coming soon</Label></div>
            </Menu.Item> */}
                {/* <Menu.Item as={Link} to="/" onClick={this.handleSidebarToggle}>
              <div><Icon name={this.state.sidebarCollapsed ? 'arrow right' : 'arrow left'} /> {this.state.sidebarCollapsed ? '' : 'Collapse'}</div>
            </Menu.Item> */}
                {/* <Menu.Item as={Link} to="/settings">
                  <div><Icon name='cog' /> {!this.state.sidebarCollapsed && 'Settings'}</div>
                </Menu.Item> */}
                {/* {(this.props.auth.isAdmin) ? (<Menu.Item as={Link} to="/settings/admin">
                  <div><Icon name='hammer' /> {!this.state.sidebarCollapsed && 'Admin'}</div>
                </Menu.Item>) : null} */}
                {/* <Menu.Item as={Link} to="/" onClick={this.handleLogout} loading={this.state.isLoggingOut}> */}
                {/* <Menu.Item onClick={this.handleLogout} loading={this.state.isLoggingOut}>
                  <div><Icon name="sign-out" /> {!this.state.sidebarCollapsed && 'Logout'}</div>
                </Menu.Item> */}
              </section>
            )}
            {this.state.openMatters && (
              <section className='fade-in'>
                <MattersList {...this.props} />
              </section>
            )}
            <div style={{ flexGrow: 1 }}></div> {/* Spacer */}
            <section>
              <Menu.Item style={{ borderBottom: 0 }}>
                <Bridge />
                {/* <p><small><Link to='/contracts/terms-of-use'>Terms of Use</Link></small></p> */}
                <p style={{ marginTop: '2em' }}><small className="subtle">&copy; 2024 Legal Tools &amp; Technology, Inc.</small></p>
                {this.state.debug && <p><Label><strong>Status:</strong> {this.props.status || 'disconnected'}</Label></p>}
              </Menu.Item>
            </section>
          </Sidebar>

          {/* <div id="main-content" style={{ marginLeft: '350px', paddingRight: '1em' }}> */}
          <Container fluid style={containerStyle}>
            {/* <Button className='mobile-only'><Icon name='ellipsis horizontal' /></Button> */}
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
                  />
                } />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/cases/:id" element={<CaseView fetchCase={this.props.fetchCase} cases={this.props.cases} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} fetchConversations={this.props.fetchConversations} onMessageSuccess={this.props.onMessageSuccess} resetChat={this.props.resetChat} chat={this.props.chat} regenAnswer={this.props.regenAnswer} getMessageInformation={this.props.getMessageInformation} />} />
                <Route path="/cases" element={<CaseHome cases={this.props.cases} fetchCases={this.props.fetchCases} chat={this.props.chat} getMessageInformation={this.props.getMessageInformation} />} />
                <Route path="/courts" element={<CourtHome courts={this.props.courts} fetchCourts={this.props.fetchCourts} chat={this.props.chat} />} />
                <Route path="/courts/:slug" element={<CourtView courts={this.props.courts} fetchCourts={this.props.fetchCourts} chat={this.props.chat} />} />
                {/**
                 * TODO: Add routes for judges, opinions, documents, people, reporters, jurisdictions, and volumes
                 * - [ ] Judges
                 * - [ ] Opinions
                 * - [ ] Documents
                 * - [ ] People
                 * - [ ] Reporters
                 * - [ ] Jurisdictions
                 * - [ ] Volumes
                 * - [ ] Resolutions
                 */}
                <Route path="/judges" element={<JudgeHome judges={this.props.judges} fetchJudges={this.props.fetchJudges} chat={this.props.chat} />} />
                <Route path="/opinions" element={<OpinionHome opinions={this.props.opinions} fetchOpinions={this.props.fetchOpinions} chat={this.props.chat} />} />
                <Route path="/documents" element={<DocumentHome documents={this.props.documents} fetchDocuments={this.props.fetchDocuments} chat={this.props.chat} />} />
                <Route path="/people" element={<PeopleHome people={this.props.people} fetchPeople={this.props.fetchPeople} chat={this.props.chat} />} />
                <Route path="/reporters" element={<PeopleHome peoples={this.props.peoples} fetchPeople={this.props.fetchPeople} chat={this.props.chat} />} />
                <Route path="/jurisdictions" element={<PeopleHome peoples={this.props.peoples} fetchPeople={this.props.fetchPeople} chat={this.props.chat} />} />
                <Route path="/volumes" element={<VolumeHome volumes={this.props.volumes} fetchVolumes={this.props.fetchVolumes} chat={this.props.chat} />} />
                <Route path="/conversations/:id" element={<Room conversation={this.props.conversation} conversations={this.props.conversations} fetchConversation={this.props.fetchConversation} chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} getMessageInformation={this.props.getMessageInformation} />} />
                <Route path="/conversations" element={<Conversations conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} onMessageSuccess={this.props.onMessageSuccess} chat={this.props.chat} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} auth={this.props.auth} getMessageInformation={this.props.getMessageInformation} />} />
                <Route path="/matters" element={<MattersHome {...this.props} conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} onMessageSuccess={this.props.onMessageSuccess} chat={this.props.chat} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer} auth={this.props.auth} getMessageInformation={this.props.getMessageInformation} />} />
                <Route path="/matters/new" element={<MattersNew {...this.props} />} />
                <Route path="/matter/:id" element={<MatterView {...this.props} />} />
                <Route path="/matter/conversation/:id" element={<MatterChat {...this.props} />} />
                <Route path="matters/conversation/new/:matterID" element={<MatterNewChat {...this.props} />} />
                <Route path="/settings" element={<Settings {...this.props} auth={this.props.auth} login={this.props.login} />} />
                <Route path="/settings/admin" element={<AdminSettings {...this.props} fetchAdminStats={this.props.fetchAdminStats} />} />
                <Route path="/contracts/terms-of-use" element={<TermsOfUse {...this.props} fetchContract={this.props.fetchContract} />} />

              </Routes>
            )}
          </Container>
          {/* </div> */}
        </div>
      </jeeves-dashboard>
    );
  }
}

module.exports = Dashboard;
