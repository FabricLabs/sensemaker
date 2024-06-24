'use strict';

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const {
  Icon,
  Menu,
  Label
} = require('semantic-ui-react');
const ConversationsList = require('./ConversationsList');
const LibrarySearch = require('./LibrarySearch');

// Constants
const {
  BRAND_NAME,
  RELEASE_NAME,
  RELEASE_DESCRIPTION,
  ENABLE_CONVERSATION_SIDEBAR,
  ENABLE_CONTRACTS,
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
  ENABLE_LIBRARY,
  USER_HINT_TIME_MS,
  USER_MENU_HOVER_TIME_MS
} = require('../constants');

class LibraryList extends React.Component {
  constructor (props) {
    super(props);

    this.messagesEndRef = React.createRef();

    this.state = {
      loading: false,
      search: '',
    };
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  render () {
    const USER_IS_ADMIN = this.props.auth.isAdmin || false;
    const USER_IS_ALPHA = this.props.auth.isAlpha || this.props.auth.isAdmin || false;
    const USER_IS_BETA = this.props.auth.isBeta || this.props.auth.isAlpha || this.props.auth.isAdmin || false;

    return (
      <div>
        {/* {(USER_IS_ALPHA || USER_IS_ADMIN) && (
          <Menu.Item>
            <jeeves-search fluid placeholder='Find...' className="ui search" title='Search is disabled.'>
              <div className="ui icon fluid input">
                <input autoComplete="off" placeholder="Find..." type="text" tabIndex="0" className="prompt" value={this.state.search} onChange={this.handleSearchChange} />
                <i aria-hidden="true" className="search icon"></i>
              </div>
            </jeeves-search>
          </Menu.Item>
        )} */}
        {(USER_IS_ALPHA || USER_IS_ADMIN) && (
          <Menu.Item style={{display:'flex', alignItems: 'center', paddingRight: '0', paddingLeft:'0'}}>
            <LibrarySearch auth={this.props.auth} searchGlobal={this.props.searchGlobal} search={this.props.search}/>
          </Menu.Item>
        )}
        <Menu.Item as={Link} to='/conversations' onClick={() => this.props.resetChat()}>
          <div><Icon name='comment alternate' /> {!this.state.sidebarCollapsed && 'Conversations'}</div>
        </Menu.Item>
        {USER_IS_BETA && ENABLE_CASE_SEARCH && (
          <Menu.Item as={Link} to='/cases'>
            <div><Icon name='briefcase' /> {!this.state.sidebarCollapsed && 'Cases'} <div style={{ float: 'right' }}><Label size='mini' color='blue'><code>beta</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_BETA && ENABLE_DOCUMENT_SEARCH && (
          <Menu.Item as={Link} to='/documents'>
            <div><Icon name='file outline alternate' /> {!this.state.sidebarCollapsed && 'Documents'} <div style={{ float: 'right' }}><Label size='mini' color='blue'><code>beta</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_JURISDICTION_SEARCH && (
          <Menu.Item as={Link} to='/jurisdictions'>
            <div><Icon name='globe' /> {!this.state.sidebarCollapsed && 'Jurisdictions'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA &&ENABLE_STATUTE_SEARCH && (
          <Menu.Item as={Link} to='/statutes'>
            <div><Icon name='law' /> {!this.state.sidebarCollapsed && 'Statutes'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_COURT_SEARCH && (
          <Menu.Item as={Link} to='/courts'>
            <div><Icon name='university' /> {!this.state.sidebarCollapsed && 'Courts'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_REPORTER_SEARCH && (
          <Menu.Item as={Link} to='/reporters'>
            <div><Icon name='newspaper outline' /> {!this.state.sidebarCollapsed && 'Reporters'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_VOLUME_SEARCH && (
          <Menu.Item as={Link} to='/volumes'>
            <div><Icon name='book' /> {!this.state.sidebarCollapsed && 'Volumes'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_JUDGE_SEARCH && (
          <Menu.Item as={Link} to='/judges'>
            <div><Icon name='user' /> {!this.state.sidebarCollapsed && 'Judges'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_OPINION_SEARCH && (
          <Menu.Item as={Link} to='/opinions'>
            <div><Icon name='balance scale' /> {!this.state.sidebarCollapsed && 'Opinions'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_PERSON_SEARCH && (
          <Menu.Item as={Link} to='/people'>
            <div><Icon name='address book' /> {!this.state.sidebarCollapsed && 'People'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ALPHA && ENABLE_CONTRACTS && (
          <Menu.Item as={Link} to='/contracts'>
            <div><Icon name='pen' /> {!this.state.sidebarCollapsed && 'Contracts'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        <ConversationsList
          resetChat={this.props.resetChat}
          fetchConversations={this.props.fetchConversations}
          auth={this.props.auth}
          conversations={this.props.conversations}
        />
      </div>
    );
  }
}

module.exports = LibraryList;
