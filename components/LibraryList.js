'use strict';

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const {
  Icon,
  Menu,
  Label,
  Popup
} = require('semantic-ui-react');

// Components
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
  ENABLE_UPLOADS,
  ENABLE_FILES,
  ENABLE_DOCUMENT_SEARCH,
  ENABLE_PERSON_SEARCH,
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

    return this;
  }

  render() {
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
          <Menu.Item style={{ display: 'flex', alignItems: 'center', paddingRight: '0', paddingLeft: '0' }}>
            <LibrarySearch auth={this.props.auth} searchGlobal={this.props.searchGlobal} search={this.props.search} />
          </Menu.Item>
        )}
        <section onClick={this.props.closeSidebars}>
          <Menu.Item as={Link} to='/conversations' onClick={() => this.props.resetChat()}>
            <div><Icon name='comment alternate' /> {!this.state.sidebarCollapsed && 'Conversations'}</div>
          </Menu.Item>
          {USER_IS_BETA && ENABLE_DOCUMENT_SEARCH && (
            <Menu.Item as={Link} to='/documents'>
              <div><Icon name='file outline alternate' /> {!this.state.sidebarCollapsed && 'Documents'} <div style={{ float: 'right' }}><Label size='mini' color='blue'><code>beta</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
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
          {USER_IS_ALPHA && ENABLE_UPLOADS && (
            <Menu.Item as={Link} to='/uploads'>
              <div><Icon name='upload' /> {!this.state.sidebarCollapsed && 'Uploads'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
            </Menu.Item>
          )}
          {(USER_IS_ALPHA || USER_IS_ADMIN) && (
            <Popup
              mouseEnterDelay={USER_HINT_TIME_MS}
              position='right center'
              trigger={(
                <Menu.Item as={Link} to='/matters' onClick={() => this.handleMenuItemClick('matters')} className='expand-menu'>
                  <div><Icon name='gavel' /> {!this.state.sidebarCollapsed && 'Matters'} <div style={{ float: 'right' }}><Label size='mini'><code>alpha</code></Label> <Label size='mini' color='green'>New!</Label></div></div>
                </Menu.Item>
              )}>
              <Popup.Content>
                <p>Upload notes, files, and more to give context to a matter</p>
              </Popup.Content>
            </Popup>
          )}
        </section>
      </div>
    );
  }
}

module.exports = LibraryList;
