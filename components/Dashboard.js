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
} = require('semantic-ui-react');

const {
  RELEASE_NAME,
  ENABLE_CASE_SEARCH,
  ENABLE_COURT_SEARCH,
  ENABLE_LIBRARY
} = require('../constants');

// Components
const Home = require('./Home');
const CaseHome = require('./CaseHome');
const CaseView = require('./CaseView');
const CourtHome = require('./CourtHome');
const Workspaces = require('./Workspaces');
const Conversations = require('./Conversations');
const Room = require('./Room');
const Settings = require('./Settings');
const AdminSettings = require('./AdminSettings');
const TermsOfUse = require('./TermsOfUse');

// Fabric Bridge
const Bridge = require('./Bridge');

class Dashboard extends React.Component {
  constructor (props) {
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

  render () {
    const sidebarStyle = this.state.sidebarCollapsed ? { width: 'auto' } : {};

    return (
      <jeeves-dashboard style={{ height: '100%' }} className='fade-in'>
        {/* <LoadingBar color="#f11946" progress={this.state.progress} /> */}
        {/* <Joyride steps={this.state.steps} /> */}
        <div id="sidebar" attached="bottom" style={{ overflow: 'hidden', borderRadius: 0, height: '100vh', backgroundColor: '#eee' }}>
          <Sidebar as={Menu} icon='labeled' inverted vertical visible={true} style={sidebarStyle} width='wide' size='huge'>
            <Menu.Item as={Link} to="/">
              <Header inverted>
                <Popup trigger={<Icon name='help' size='tiny' style={{ float: 'right', marginTop: '1em' }} />}>
                  <Popup.Header>Need Help?</Popup.Header>
                  <Popup.Content>
                    <p>Send us an email: <a href="mailto:support@jeeves.dev">support@jeeves.dev</a></p>
                    {/* <p><strong>Call Chuck!</strong> +1 (d00) p00-d00p</p> */}
                  </Popup.Content>
                </Popup>
                <img src="/images/jeeves-tux.png" class="icon" style={{ height: '1.2em', width: '1.2em', verticalAlign: 'top' }} /> J{this.state.sidebarCollapsed ? '' : 'EEVES'}
                <Popup trigger={<Label color='black'>alpha</Label>}>
                  <Popup.Content>Exclusive access!</Popup.Content>
                </Popup>
              </Header>
            </Menu.Item>
            {/* <Menu.Item>
              <jeeves-search fluid disabled placeholder='Find...' className="ui disabled search" title='Search is disabled.'>
                <div className="ui icon fluid input">
                  <input disabled autoComplete="off" placeholder="Find..." type="text" tabIndex="0" className="prompt" value={this.state.search} onChange={this.handleSearchChange} />
                  <i aria-hidden="true" className="search icon"></i>
                </div>
              </jeeves-search>
            </Menu.Item> */}
            <Menu.Item as={Link} to="/">
              <div><Icon name='home' /> {!this.state.sidebarCollapsed && 'Home'}</div>
            </Menu.Item>
            <Menu.Item as={Link} to="/conversations">
              <div><Icon name='quote left' /> {!this.state.sidebarCollapsed && 'Conversations'} {this.state.conversationAlert ? <Label size='mini' color='red'>!</Label>: null}</div>
            </Menu.Item>
            {ENABLE_CASE_SEARCH && (
              <Menu.Item as={Link} to='/cases'>
                <div><Icon name='briefcase' /> {!this.state.sidebarCollapsed && 'Cases'} <Label size='mini' color='green'>New!</Label></div>
              </Menu.Item>
            )}
            {ENABLE_COURT_SEARCH && (
              <Menu.Item as={Link} to='/courts'>
                <div><Icon name='university' /> {!this.state.sidebarCollapsed && 'Courts'} <Label size='mini' color='green'>New!</Label></div>
              </Menu.Item>
            )}
            {ENABLE_LIBRARY && (
              <Menu.Item disabled>
                <div>
                  <Icon name='book' />
                  {!this.state.sidebarCollapsed && 'Library'}
                  &nbsp;<Label size='mini' color='orange'>disabled</Label>
                </div>
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
            <Menu.Item as={Link} to="/settings">
              <div><Icon name='cog' /> {!this.state.sidebarCollapsed && 'Settings'}</div>
            </Menu.Item>
            {(this.props.auth.isAdmin) ? (<Menu.Item as={Link} to="/settings/admin">
              <div><Icon name='hammer' /> {!this.state.sidebarCollapsed && 'Admin'}</div>
            </Menu.Item>) : null}
            {/* <Menu.Item as={Link} to="/" onClick={this.handleLogout} loading={this.state.isLoggingOut}> */}
            <Menu.Item  onClick={this.handleLogout} loading={this.state.isLoggingOut}>
              <div><Icon name="sign-out" /> {!this.state.sidebarCollapsed && 'Logout'}</div>
            </Menu.Item>
            <Menu.Item style={{ borderBottom: 0 }}>
              <Bridge />
              {/* <p><small><Link to='/contracts/terms-of-use'>Terms of Use</Link></small></p> */}
              <p style={{ marginTop: '2em' }}><small class="subtle">&copy; 2023 Legal Tools &amp; Technology, Inc.</small></p>
              {this.state.debug && <p><Label><strong>Status:</strong> {this.props.status || 'disconnected'}</Label></p>}
            </Menu.Item>
          </Sidebar>
        </div>
        <div id="main-content" style={{ marginLeft: '350px', paddingRight: '1em' }}>
            <Container fluid style={{ margin: '1em' }}>
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
                    />
                  } />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/cases/:id" element={<CaseView fetchCase={this.props.fetchCase} cases={this.props.cases} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} fetchConversations={this.props.fetchConversations} onMessageSuccess={this.props.onMessageSuccess} resetChat={this.props.resetChat} chat={this.props.chat} regenAnswer={this.props.regenAnswer}/>}/>
                  <Route path="/cases" element={<CaseHome cases={this.props.cases} fetchCases={this.props.fetchCases} chat={this.props.chat}/>} />
                  <Route path="/courts" element={<CourtHome courts={this.props.courts} fetchCourts={this.props.fetchCourts} chat={this.props.chat}/>} />
                  <Route path="/conversations/:id" element={<Room conversation={this.props.conversation} fetchConversation={this.props.fetchConversation} chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} resetChat={this.props.resetChat} regenAnswer={this.props.regenAnswer}/>} />
                  <Route path="/conversations" element={<Conversations conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} chat={this.props.chat}/>} />
                  <Route path="/settings" element={<Settings {...this.props} auth={this.props.auth} login={this.props.login} />} />
                  <Route path="/settings/admin" element={<AdminSettings {...this.props} fetchAdminStats={this.props.fetchAdminStats} />} />
                  <Route path="/contracts/terms-of-use" element={<TermsOfUse {...this.props} fetchContract={this.props.fetchContract} />} />
                </Routes>
              )}
            </Container>
          </div>
      </jeeves-dashboard>
    );
  }
}

module.exports = Dashboard;
