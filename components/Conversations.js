'use strict';

const {
  ENABLE_CONTACTS,
  ENABLE_FABRIC
} = require('../constants');

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const {
  Button,
  Card,
  Label,
  Segment,
  Pagination,
  Divider,
  Icon,
  Form,
  Search,
  Modal,
  Dropdown,
  Popup
} = require('semantic-ui-react');

// Components
const ChatBox = require('./ChatBox');
const UserProfileSection = require('./UserProfileSection');

// Functions
const toRelativeTime = require('../functions/toRelativeTime');

/**
 * The Conversations UI.
 * @param {Object} props Properties for the component.
 **/
class Conversations extends React.Component {
  constructor(props) {
    super(props);

    this.messagesEndRef = React.createRef();

    this.state = {
      currentPage: 1,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      editingID: null, // ID of the conversation being edited
      editedTitle: '', // Temporary state for the input value
      editLoading: false,
      searchQuery: '', // Add search query to state
      isGlobalHovered: false,
      newConversationModalOpen: false,
      newConversationTitle: '',
      documentSearchQuery: '',
      selectedDocuments: [], // Array of selected documents
      documentSearchResults: [], // Search results for documents
      documentSearchLoading: false // Loading state for document search
    };
  }

  componentDidMount () {
    this.props.fetchConversations();
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  }

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth, windowHeight: window.innerHeight });
  }

  //handle when you click edit on a conversation title
  handleEditClick = (conversationID, currentTitle) => {
    this.setState({ editingID: conversationID, editedTitle: currentTitle });
  };

  handleSaveEditing = async (conversationID) => {
    const { editedTitle } = this.state;
    this.setState({ editLoading: true });

    const fetchPromise = fetch(`/conversations/${conversationID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.props.auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: editedTitle }),
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Fetch timed out'));
      }, 15000);
    });

    try {
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (response.ok) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.setState({ editingID: null, editedTitle: '', editLoading: false });
        this.props.fetchConversations();

      } else {
        console.error('API request failed with status:', response.status);
      }
    } catch (error) {
      if (error.message === 'Fetch timed out') {
        console.log("check your internet connection");
      } else {
        console.error('Title update Error:', error.message);
      }
      this.setState({ editingID: null, editedTitle: '', editLoading: false });
    }
  };

  handleCancelEditing = () => {
    // Reset editing state without saving
    this.setState({ editingID: null, editedTitle: '' });
  };

  handlePinConversation = async (conversationID, currentPinned) => {
    try {
      const response = await fetch(`/conversations/${conversationID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.props.auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinned: !currentPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pin status');
      }

      // Refresh conversations list to reflect the change
      this.props.fetchConversations();
    } catch (error) {
      console.error('Error updating pin status:', error);
    }
  };

  handleSearchChange = (e, { value }) => {
    this.setState({
      searchQuery: value,
      currentPage: 1 // Reset to first page when searching
    });
  };

  handleNewConversationOpen = () => {
    this.props.resetChat(); // Reset chat state before opening modal
    this.setState({ newConversationModalOpen: true });
  }

  handleNewConversationClose = () => {
    this.setState({
      newConversationModalOpen: false,
      newConversationTitle: ''
    });
  }

  handleNewConversationTitleChange = (e, { value }) => {
    this.setState({ newConversationTitle: value });
  }

  handleNewConversationSubmit = async () => {
    const { newConversationTitle } = this.state;

    try {
      const response = await fetch('/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.props.auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newConversationTitle || 'New Conversation'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      this.handleNewConversationClose();
      this.props.fetchConversations();

      // Navigate to the new conversation
      this.props.navigate(`/conversations/${data.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }

  handleDocumentSearchChange = async (e, { value }) => {
    this.setState({ documentSearchQuery: value, documentSearchLoading: true });

    try {
      const response = await fetch('/documents', {
        method: 'SEARCH',
        headers: {
          'Authorization': `Bearer ${this.props.auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: value }),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      this.setState({
        documentSearchResults: data.results || [],
        documentSearchLoading: false
      });
    } catch (error) {
      console.error('Document search error:', error);
      this.setState({ documentSearchLoading: false });
    }
  };

  handleDocumentSelect = (e, { value }) => {
    this.setState({ selectedDocuments: value });
  };

  render () {
    const { loading, error, conversations, users } = this.props;
    const { currentPage, windowWidth, windowHeight, editLoading, searchQuery, newConversationModalOpen, newConversationTitle, documentSearchQuery, selectedDocuments, documentSearchResults, documentSearchLoading } = this.state;

    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    // Filter conversations based on search query only
    const filteredConversations = conversations.filter(conversation => {
      if (searchQuery) {
        return conversation && conversation.title &&
          conversation.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

    // Calculate conversations for current page
    const itemsPerPage = windowWidth < 600 ? 11 : windowWidth < 769 ? 14 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = filteredConversations.slice(indexOfFirstItem, indexOfLastItem);
    const componentStyle = {
      display: 'absolute',
      top: '1em',
      left: 'calc(350px + 1em)',
      height: 'calc(100vh - 5rem)', // Set a maximum height
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '0'
    };

    const conversationCount = conversations.length;

    return (
      <sensemaker-conversations>
        <Segment className='fade-in' fluid style={{ minHeight: '100%', maxHeight: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
            <h2 style={{ marginTop: '0' }}>Chat</h2>
            <Button.Group>
              {ENABLE_FABRIC && <Button
                icon
                color='black'
                as={Link}
                to='/services/global'
                content={<Icon name='globe' />}
                popup={{ content: 'Global chat', position: 'bottom center' }}
              />}
              <Button
                icon
                color='black'
                as={Link}
                to='/contacts'
                content={<Icon name='address book outline' />}
                popup={{ content: 'Your contacts', position: 'bottom center' }}
              />
              <Button
                icon
                primary
                labelPosition='right'
                onClick={this.handleNewConversationOpen}
              >
                New Conversation
                <Icon name='right chevron' />
              </Button>
            </Button.Group>
          </div>
          <p>
            {searchQuery ?
              `Found ${filteredConversations.length} matching conversations` :
              `Tracking ${conversations.length} conversations.`
            }
          </p>
          {ENABLE_CONTACTS && (
            <div className='desktop-only'>
              <h3>Contacts</h3>
              <Card.Group>
                <Card as={Link} to={`/users/sensemaker` + ''}>
                  <Card.Content>
                    <Card.Header>sensemaker</Card.Header>
                    <Card.Meta>Joined in 2021</Card.Meta>
                    <Card.Description></Card.Description>
                  </Card.Content>
                </Card>
                {users && users.users.slice(0, 2).map(user => {
                  <Card key={user.id} as={Link} to={`/users/${user.username}`}>
                    <Card.Content>
                      <Card.Header>{user.username}</Card.Header>
                      <Card.Meta>Joined in {new Date(user.created_at).getFullYear()}</Card.Meta>
                      <Card.Description></Card.Description>
                    </Card.Content>
                  </Card>
                })}
              </Card.Group>
            </div>
          )}
          {/* <div className='right floated'>
            <Button.Group>
              <Button><Icon name='asterisk' /> All</Button>
              <Button><Icon name='download' /> Local</Button>
              <Button color='blue' as={Link} to='/services/discord'><Icon name='discord' /> Discord</Button>
            </Button.Group>
          </div> */}
          <h3>Conversations</h3>
          <div style={{ width: '100%' }}>
            <Search
              fluid
              input={{
                fluid: true,
                size: 'large',
                placeholder: 'Search conversations...'
              }}
              value={this.state.searchQuery}
              onSearchChange={this.handleSearchChange}
              showNoResults={false}
            />
          </div>
          {(currentConversations && currentConversations.length) ? (
            <Card.Group style={{ marginTop: '1em', marginBottom: '1em' }}>
              {currentConversations.map(conversation => {
                return (
                  <Card key={conversation.id} fluid className='conversationItem' style={{
                    marginTop: '1em',
                    ...(conversation.pinned && {
                      border: '2px solid #fbbd08',
                      boxShadow: '0 2px 4px 0 rgba(251, 189, 8, 0.12), 0 2px 10px 0 rgba(251, 189, 8, 0.08)'
                    })
                  }}>
                    <Card.Content extra>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <abbr className='relative-time' title={new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}>{new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</abbr>
                        {conversation.pinned && (
                          <Label size='mini' color='yellow' style={{ margin: 0 }}>
                            <Icon name='pin' />
                            Pinned
                          </Label>
                        )}
                      </div>
                    </Card.Content>
                    <Card.Content>
                      {this.state.editingID === conversation.id ? (
                        <Form>
                          <div className='conversation-line'>
                            <div className='conversation-line-input'>
                              <Form.Input
                                type="text"
                                maxLength={255}
                                value={this.state.editedTitle}
                                onChange={(e) => this.setState({ editedTitle: e.target.value })}
                                autoFocus
                                fluid
                                loading={editLoading}
                              />
                            </div>
                            <Icon
                              name='check'
                              className='saveIcon'
                              style={{ cursor: 'pointer', color: 'grey' }}
                              onClick={() => this.handleSaveEditing(conversation.id)}
                              size='big'
                              title='Save'
                            />
                            <Icon
                              name='cancel'
                              className='cancelIcon'
                              style={{ cursor: 'pointer', color: 'grey' }}
                              onClick={this.handleCancelEditing}
                              size='big'
                              title='Cancel'
                            />
                          </div>
                        </Form>
                      ) : (
                        <Card.Header>
                          <Link to={'/conversations/' + conversation.slug} className='ui right floated icon blue button'>Resume <Icon name='right chevron' /></Link>
                          <Popup
                            content={conversation.summary || 'No summary available'}
                            trigger={
                              <Link to={'/conversations/' + conversation.slug} as='h4' onClick={() => this.props.resetChat()}>{conversation.title}</Link>
                            }
                            position='top left'
                            hoverable
                          />
                          <Icon
                            name={conversation.pinned ? 'pin' : 'outline pin'}
                            className='pinIcon'
                            onClick={() => this.handlePinConversation(conversation.dbid, conversation.pinned)}
                            title={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
                            style={{ cursor: 'pointer', color: conversation.pinned ? '#fbbd08' : 'grey', marginRight: '0.5em' }}
                          />
                          <Icon name='edit' className='editIcon' onClick={() => this.handleEditClick(conversation.id, conversation.title)} title='Edit' />
                        </Card.Header>
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
            </Card.Group>
          ) : <div ref={this.messagesEndRef} style={componentStyle}>
            {/* <div style={{marginBottom: '2em'}}>We haven't had any conversations yet.</div> */}
            {/* <Button as={Link} to='/conversations/new' primary>Ask a Question</Button> */}
            <ChatBox
              {...this.props}
              messagesEndRef={this.messagesEndRef}
              includeFeed={true}
              placeholder={'Ask me anything...'}
              resetInformationSidebar={this.props.resetInformationSidebar}
              messageInfo={this.props.messageInfo}
              thumbsUp={this.props.thumbsUp}
              thumbsDown={this.props.thumbsDown}
            />
          </div>}
          {/* Full-width Pagination Controls */}
          {(conversations.length > itemsPerPage) ? (
            <div style={{
              width: '100%',
              marginTop: '1em',
              marginBottom: '1em'
            }}>
              <style>
                {`
                  .full-width-pagination.ui.pagination.menu {
                    width: 100% !important;
                    display: flex !important;
                  }
                  .full-width-pagination.ui.pagination.menu .item:last-child {
                    margin-left: auto !important;
                  }
                `}
              </style>
              <Pagination
                className="full-width-pagination"
                activePage={currentPage}
                totalPages={Math.ceil(conversations.length / itemsPerPage)}
                onPageChange={this.handlePaginationChange}
                boundaryRange={Math.ceil(conversations.length / itemsPerPage) <= 10 ? Math.ceil(conversations.length / itemsPerPage) : 2}
                siblingRange={Math.ceil(conversations.length / itemsPerPage) <= 15 ? Math.ceil(conversations.length / itemsPerPage) : 3}
                showEllipsis={Math.ceil(conversations.length / itemsPerPage) > 15}
                showFirstAndLastNav={true}
                showPreviousAndNextNav={true}
                firstItem={{
                  'aria-label': 'First item',
                  content: '«',
                  disabled: currentPage === 1
                }}
                prevItem={{
                  'aria-label': 'Previous item',
                  content: '‹',
                  disabled: currentPage === 1
                }}
                nextItem={{
                  'aria-label': 'Next item',
                  content: '›',
                  disabled: currentPage === Math.ceil(conversations.length / itemsPerPage)
                }}
                lastItem={{
                  'aria-label': 'Last item',
                  content: '»',
                  disabled: currentPage === Math.ceil(conversations.length / itemsPerPage)
                }}
              />
            </div>
          ) : null}
          {(currentConversations && currentConversations.length) ? (
            <ChatBox
              {...this.props}
              messagesEndRef={this.messagesEndRef}
              includeAttachments={false}
              includeFeed={true}
              placeholder={'Ask about these conversations...'}
              context={{ conversations: currentConversations }}
              resetInformationSidebar={this.props.resetInformationSidebar}
              messageInfo={this.props.messageInfo}
              thumbsUp={this.props.thumbsUp}
              thumbsDown={this.props.thumbsDown}
              style={{ margin: '0' }}
            />
          ) : null}
          <Modal
            open={newConversationModalOpen}
            onClose={this.handleNewConversationClose}
            size='large'
          >
            <Modal.Header>New Conversation</Modal.Header>
            <Modal.Content>
              <Form>
                <Form.Input
                  fluid
                  label='Title'
                  placeholder='Enter conversation title...'
                  value={newConversationTitle}
                  onChange={this.handleNewConversationTitleChange}
                />
                <Form.Dropdown
                  fluid
                  multiple
                  search
                  selection
                  label='Add Documents to Context'
                  placeholder='Search for documents...'
                  options={documentSearchResults.map(doc => ({
                    key: doc.id,
                    text: doc.title || `Document ${doc.id}`,
                    value: doc.id,
                    description: doc.content ? doc.content.substring(0, 100) + '...' : ''
                  }))}
                  value={selectedDocuments}
                  onSearchChange={this.handleDocumentSearchChange}
                  onChange={this.handleDocumentSelect}
                  loading={documentSearchLoading}
                  noResultsMessage="Type to search documents..."
                />
                <ChatBox
                  {...this.props}
                  messagesEndRef={this.messagesEndRef}
                  includeAttachments={true}
                  includeFeed={true}
                  placeholder='Start your conversation...'
                  resetInformationSidebar={this.props.resetInformationSidebar}
                  messageInfo={this.props.messageInfo}
                  thumbsUp={this.props.thumbsUp}
                  thumbsDown={this.props.thumbsDown}
                  style={{ margin: '1em 0' }}
                  chat={{ messages: [] }} // Force empty messages array
                  context={{ documents: selectedDocuments }} // Pass selected documents to context
                />
              </Form>
            </Modal.Content>
            <Modal.Actions>
              <Button color='black' onClick={this.handleNewConversationClose}>
                Cancel
              </Button>
              <Button
                positive
                icon='checkmark'
                labelPosition='right'
                content='Create'
                onClick={this.handleNewConversationSubmit}
              />
            </Modal.Actions>
          </Modal>
        </Segment>
      </sensemaker-conversations>
    );
  }
}

module.exports = Conversations;
