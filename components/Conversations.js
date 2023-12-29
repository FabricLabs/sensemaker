'use strict';

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const { Label, Segment, Pagination, Divider, Button, Icon, Form } = require('semantic-ui-react');

// Components
const ChatBox = require('./ChatBox');

/**
 * The Jeeves UI.
 * @param {Object} props Properties for the component.
 **/
class Conversations extends React.Component {
  constructor(props) {
    super(props);

    this.messagesEndRef = React.createRef();

    this.state = {
      currentPage: 1,
      windowWidth: window.innerWidth,
      editingId: null, // ID of the conversation being edited
      editValue: '', // Temporary state for the input value
    };
  }

  componentDidMount() {
    this.props.fetchConversations();
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  }

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  }

  //handle when you click edit on a conversation title
  handleEditClick = (conversationId, currentTitle) => {
    this.setState({ editingId: conversationId, editValue: currentTitle });
  };

  handleSaveEditing = (conversationId) => {
    console.log("Saving new title:", this.state.editValue, "for conversation ID:", conversationId);

    // Reset editing state
    this.setState({ editingId: null, editValue: '' });

    // TODO: Update the conversation title in your state or backend
  };

  handleCancelEditing = () => {
    // Reset editing state without saving
    this.setState({ editingId: null, editValue: '' });
  };

  render() {
    const { loading, error, conversations } = this.props;
    const { currentPage, windowWidth } = this.state;


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

    return (
      <Segment className='fade-in' fluid>
        <h2>Conversations</h2>
        {(currentConversations && currentConversations.length) ? currentConversations.map(conversation => (
          <div
            key={conversation.id}
            className="conversationItem"
          >
            <h4 style={{ marginBottom: '0.5em' }}>
              {this.state.editingId === conversation.id ? (
                <Form>
                  <div className='conversation-line'>
                    <div className='conversation-line-input'>
                      <Form.Input
                        type="text"
                        maxLength={255}
                        value={this.state.editValue}
                        onChange={(e) => this.setState({ editValue: e.target.value })}
                        autoFocus
                        fluid
                      />
                    </div>
                    <Icon
                      name='check'
                      className='saveIcon'
                      style={{ cursor: 'pointer', color: 'green' }}
                      onClick={() => this.handleSaveEditing(conversation.id)}
                      size='big'
                      title='Save'
                    />
                    <Icon
                      name='cancel'
                      className='cancelIcon'
                      style={{ cursor: 'pointer', color: 'red' }}
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
