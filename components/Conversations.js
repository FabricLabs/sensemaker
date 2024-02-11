'use strict';

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const {
  Label,
  Segment,
  Pagination,
  Divider,
  Button,
  Icon,
  Form
} = require('semantic-ui-react');

// Components
const ChatBox = require('./ChatBox');

/**
 * The Jeeves UI.
 * @param {Object} props Properties for the component.
 **/
class Conversations extends React.Component {
  constructor (props) {
    super(props);

    this.messagesEndRef = React.createRef();

    this.state = {
      currentPage: 1,
      windowWidth: window.innerWidth,
      editingID: null, // ID of the conversation being edited
      editedTitle: '', // Temporary state for the input value
      editLoading: false,
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
    this.setState({ windowWidth: window.innerWidth });
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
        error('API request failed with status:', response.status);
      }
    } catch (error) {
      if (error.message === 'Fetch timed out') {
        console.log("check your internet connection");
      } else {
        console.error('Title update Error:', error.message);
      }
      this.setState({ editingID: null, editedTitle: '', editLoading: false});
    }
  };

  handleCancelEditing = () => {
    // Reset editing state without saving
    this.setState({ editingID: null, editedTitle: '' });
  };

  render () {
    const { loading, error, conversations } = this.props;
    const { currentPage, windowWidth, editLoading } = this.state;

    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    // Calculate conversations for current page
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

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
      <Segment className='fade-in' fluid style={{ minHeight: '34em' }}>
        <h2>Conversations</h2>
        <p>Tracking <strong>{conversationCount}</strong> conversations.</p>
        {(currentConversations && currentConversations.length) ? currentConversations.map(conversation => (
          <div
            key={conversation.id}
            className="conversationItem"
          >
            <h4 style={{ marginBottom: '0.5em' }}>
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
                <div>
                  <Link to={'/conversations/' + conversation.id}>
                    {new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}{": "}
                    {conversation.title}
                  </Link>
                  <Icon
                    name='edit'
                    className='editIcon'
                    onClick={() => this.handleEditClick(conversation.id, conversation.title)}
                    title='Edit'
                  />
                </div>
              )}
            </h4>
            <Divider style={{ marginTop: '0.3em', marginBottom: '0.5em' }} />
          </div>
        )) : <div ref={this.messagesEndRef} style={componentStyle}>
          {/* <div style={{marginBottom: '2em'}}>We haven't had any conversations yet.</div> */}
          {/* <Button as={Link} to='/conversations/new' primary>Ask a Question</Button> */}
          <ChatBox
            {...this.props}
            messagesEndRef={this.messagesEndRef}
            includeFeed={true}
            placeholder={'Ask me anything...'}
          />

        </div>}
        {(conversations.length > itemsPerPage) ? <Pagination
          size='tiny'
          activePage={currentPage}
          totalPages={Math.ceil(conversations.length / itemsPerPage)}
          onPageChange={this.handlePaginationChange}
          ellipsisItem={(windowWidth > 480) ? undefined : null}
          boundaryRange={(windowWidth > 480) ? 1 : 0}
        /> : null}
      </Segment>
    );
  }
}

module.exports = Conversations;
