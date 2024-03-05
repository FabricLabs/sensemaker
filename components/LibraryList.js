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

const {
  BRAND_NAME,
  RELEASE_NAME,
  RELEASE_DESCRIPTION,
  ENABLE_CONVERSATION_SIDEBAR,
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
  constructor(props) {
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

  render() {
    const USER_IS_ADMIN = this.props.auth.isAdmin || false;
    const USER_IS_ALPHA = this.props.auth.isAlpha || false;
    const USER_IS_BETA = this.props.auth.isBeta || false;
    // const USER_IS_ADMIN = true;
    // const USER_IS_ALPHA = true;
    // const USER_IS_BETA = true;

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
          <Menu.Item className='col-center'>
            <LibrarySearch auth={this.props.auth} />
          </Menu.Item>
        )}
        <Menu.Item as={Link} to='/conversations'>
          <div><Icon name='comment alternate' /> {!this.state.sidebarCollapsed && 'Conversations'}</div>
        </Menu.Item>
        {ENABLE_STATUTE_SEARCH && (
          <Menu.Item as={Link} to='/statues'>
            <div><Icon name='user' /> {!this.state.sidebarCollapsed && 'Statutes'} <Label size='mini' color='green'>New!</Label></div>
          </Menu.Item>
        )}
        {(USER_IS_ALPHA || USER_IS_ADMIN) && ENABLE_DOCUMENT_SEARCH && (
          <Menu.Item as={Link} to='/documents'>
            <div><Icon name='book' /> {!this.state.sidebarCollapsed && 'Documents'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ADMIN && ENABLE_JURISDICTION_SEARCH && (
          <Menu.Item as={Link} to='/jurisdictions'>
            <div><Icon name='users' /> {!this.state.sidebarCollapsed && 'Jurisdictions'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_ADMIN && ENABLE_COURT_SEARCH && (
          <Menu.Item as={Link} to='/courts'>
            <div><Icon name='university' /> {!this.state.sidebarCollapsed && 'Courts'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
          </Menu.Item>
        )}
        {USER_IS_BETA && ENABLE_CASE_SEARCH && (
          <Menu.Item as={Link} to='/cases'>
            <div><Icon name='briefcase' /> {!this.state.sidebarCollapsed && 'Cases'} <div style={{ float: 'right' }}><Label size='mini' color='blue'><code>beta</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
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
              &nbsp;<div style={{ float: 'right' }}><Label size='mini' color='orange'>disabled</Label></div>
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
