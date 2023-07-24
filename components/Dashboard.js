'use strict';

// Dependencies
const React = require('react');
const { Link, Navigate, Route, Routes, Switch } = require('react-router-dom');
// const LoadingBar = require('react-top-loading-bar');

// Semantic UI
const {
  Button,
  Container,
  Header,
  Icon,
  Image,
  Label,
  Menu,
  Search,
  Segment,
  Sidebar,
} = require('semantic-ui-react');

// Components
const Home = require('./Home');
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

    this.state = {
      loading: false,
      username: '(guest account)',
      search: '',
      sidebarCollapsed: false,
      sidebarVisible: true,
      progress: 0,
      isLoading: true,
      isLoggingOut: false
    };
  }

  ref = () => {
    return React.createRef()
  }

  componentDidMount () {
    // this.startProgress();

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

  render () {
    const sidebarStyle = this.state.sidebarCollapsed ? { width: 'auto' } : {};

    return (
      <jeeves-dashboard style={{ height: '100%' }} className='fade-in'>
        {/* <LoadingBar color="#f11946" progress={this.state.progress} /> */}
        <Sidebar.Pushable attached="bottom" style={{ overflow: 'hidden', borderRadius: 0, height: '100vh', backgroundColor: '#eee' }}>
          <Sidebar as={Menu} animation='push' icon='labeled' inverted vertical visible style={sidebarStyle} width='wide' size='huge'>
            <Menu.Item as={Link} to="/">
              <Header inverted><img src="/images/jeeves-tux.png" class="icon" style={{ height: '1.2em', width: '1.2em', verticalAlign: 'top' }} /> J{this.state.sidebarCollapsed ? '' : 'EEVES'}</Header>
            </Menu.Item>
            <Menu.Item>
              <jeeves-search fluid disabled placeholder='Find...' className="ui disabled search">
                <div className="ui icon fluid input">
                  <input disabled autoComplete="off" placeholder="Find..." type="text" tabIndex="0" className="prompt" value={this.state.search} onChange={this.handleSearchChange} />
                  <i aria-hidden="true" className="search icon"></i>
                </div>
              </jeeves-search>
            </Menu.Item>
            <Menu.Item as={Link} to="/">
              <div><Icon name='home' /> {!this.state.sidebarCollapsed && 'Home'}</div>
            </Menu.Item>
            <Menu.Item as={Link} to="/conversations">
              <div><Icon name='quote left' /> {!this.state.sidebarCollapsed && 'Conversations'} <Label size='mini' color='red'>!</Label></div>
            </Menu.Item>
            <Menu.Item disabled>
              <div><Icon name='book' /> {!this.state.sidebarCollapsed && 'Library'} <Label size='mini' color='orange'>disabled</Label></div>
            </Menu.Item>
            <Menu.Item disabled>
              <div><Icon name='briefcase' /> {!this.state.sidebarCollapsed && 'Cases'} <Label size='mini' color='blue'>coming soon</Label></div>
            </Menu.Item>
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
            {(this.state.isAdmin) ? (<Menu.Item as={Link} to="/settings/admin">
              <div><Icon name='hammer' /> {!this.state.sidebarCollapsed && 'Admin'}</div>
            </Menu.Item>) : null}
            <Menu.Item as={Link} to="/" onClick={this.handleLogout}>
              <div><Icon name="sign-out" /> {!this.state.sidebarCollapsed && 'Logout'}</div>
            </Menu.Item>
            <Menu.Item>
              <Bridge />
              <div>
                <p><small><Link to='/contracts/terms-of-use'>Terms of Use</Link></small></p>
                <p><small>&copy; 2023 Legal Tools &amp; Technology, Inc.</small></p>
              </div>
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher style={{ margin: '1em', paddingRight: '340px' }}>
            <Container fluid>
              {this.state.isLoading ? null : (
                <Routes>
                  <Route path="*" element={<Navigate to='/' replace />} />
                  <Route path="/" element={
                    <Home
                      fetchConversations={this.props.fetchConversations}
                      getMessages={this.props.getMessages}
                      submitMessage={this.props.submitMessage}
                      onMessageSuccess={this.props.onMessageSuccess}
                      chat={this.props.chat}
                    />
                  } />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/conversations/:id" element={<Room conversation={this.props.conversation} fetchConversation={this.props.fetchConversation} chat={this.props.chat} getMessages={this.props.getMessages} submitMessage={this.props.submitMessage} />} />
                  <Route path="/conversations" element={<Conversations conversations={this.props.conversations} fetchConversations={this.props.fetchConversations} />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/admin" element={<AdminSettings {...this.props} fetchAdminStats={this.props.fetchAdminStats} />} />
                  <Route path="/contracts/terms-of-use" element={<TermsOfUse {...this.props} fetchContract={this.props.fetchContract} />} />
                </Routes>
              )}
            </Container>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </jeeves-dashboard>
    );
  }
}

module.exports = Dashboard;
