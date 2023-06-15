'use strict';

// Dependencies
const React = require('react');
const { Link, Route, Routes } = require('react-router-dom');
const LoadingBar = require('react-top-loading-bar');

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
const Settings = require('./Settings');

class Dashboard extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      loading: false,
      username: '(guest account)',
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

  render () {
    const sidebarStyle = this.state.sidebarCollapsed ? { width: 'auto' } : {};

    return (
      <jeeves-dashboard>
        {/* <LoadingBar color="#f11946" progress={this.state.progress} /> */}
        <Sidebar.Pushable attached="bottom" style={{ overflow: 'hidden', borderRadius: 0, height: '100vh' }}>
          <Sidebar as={Menu} animation='push' icon='labeled' inverted vertical left visible style={sidebarStyle} width='wide' size='huge'>
            <Menu.Item as={Link} to="/">
              <Header inverted>J{this.state.sidebarCollapsed ? '' : 'EEVES'}</Header>
            </Menu.Item>
            <Menu.Item>
              <jeeves-search fluid disabled placeholder='Find...' class="ui disabled search">
                <div class="ui icon fluid input">
                  <input autocomplete="off" placeholder="Find..." type="text" tabindex="0" class="prompt" value="" />
                  <i aria-hidden="true" class="search icon"></i>
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
            <Menu.Item disabled>
              <div><Icon name='law' /> {!this.state.sidebarCollapsed && 'Resolutions'} <Label size='mini' color='blue'>coming soon</Label></div>
            </Menu.Item>
            <Menu.Item disabled as={Link} to="/workspaces">
              <div><Icon name='users' /> {!this.state.sidebarCollapsed && 'Workspaces'} <Label size='mini' color='blue'>coming soon</Label></div>
            </Menu.Item>
            {/* <Menu.Item as={Link} to="/" onClick={this.handleSidebarToggle}>
              <div><Icon name={this.state.sidebarCollapsed ? 'arrow right' : 'arrow left'} /> {this.state.sidebarCollapsed ? '' : 'Collapse'}</div>
            </Menu.Item> */}
            <Menu.Item as={Link} to="/settings">
              <div><Icon name='cog' /> {!this.state.sidebarCollapsed && 'Settings'}</div>
            </Menu.Item>
            <Menu.Item disabled>
              <div><Icon name='hammer' /> {!this.state.sidebarCollapsed && 'Admin'}</div>
            </Menu.Item>
            <Menu.Item as={Link} to="/" onClick={this.handleLogout}>
              <div><Icon name="sign-out" /> {!this.state.sidebarCollapsed && 'Logout'}</div>
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher style={{ margin: '1em', paddingRight: '350px' }}>
            <Container fluid>
              {this.state.isLoading ? null : (
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/settings" element={<Settings />} />
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
