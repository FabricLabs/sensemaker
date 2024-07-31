'use strict';

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const {
  Divider,
  Icon,
  Form,
  Menu,
} = require('semantic-ui-react');


/**
 * The Jeeves UI.
 * @param {Object} props Properties for the component.
 **/
class ConversationsList extends React.Component {
  constructor(props) {
    super(props);

    this.messagesEndRef = React.createRef();

    this.state = {
      currentPage: 1,
      windowWidth: window.innerWidth,
      editingID: null, // ID of the conversation being edited
      editedTitle: '', // Temporary state for the input value
      editLoading: false,
      showOlder: false,
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
      this.setState({ editingID: null, editedTitle: '', editLoading: false });
    }
  };

  handleCancelEditing = () => {
    // Reset editing state without saving
    this.setState({ editingID: null, editedTitle: '' });
  };

  // Helper method to get the difference in days between two dates
  getDaysAgo = (date) => {
    const today = new Date();
    const createdAt = new Date(date);
    const differenceInTime = today.getTime() - createdAt.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  }

  // Method to group conversations by when they were created
  groupConversationsByDate = () => {
    const groupedConversations = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: []
    };

    this.props.conversations.forEach(conversation => {
      const daysAgo = this.getDaysAgo(conversation.created_at);

      if (daysAgo === 0) {
        groupedConversations.today.push(conversation);
      } else if (daysAgo === 1) {
        groupedConversations.yesterday.push(conversation);
      } else if (daysAgo <= 7) {
        groupedConversations.last7Days.push(conversation);
      } else if (daysAgo <= 30) {
        groupedConversations.last30Days.push(conversation);
      } else {
        groupedConversations.older.push(conversation);
      }
    });

    return groupedConversations;
  }

  renderConversationsSection = (title, conversations) => {

    const linkStyle = {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'block',
      maxWidth: '92%',
      color: '#e4dfda',
      textAlign: 'left',
    };

    return (
      <div>
        {(title !== 'Older') ? (
          <h3 style={{ color: 'grey', marginBottom: '0.25em', marginTop: '0', textTransform: 'none' }}>{title}</h3>
        ) : (
          <h3 style={{ color: 'grey', cursor: 'pointer', marginBottom: '0', marginTop: '0', textTransform: 'none' }} onClick={() => this.setState({ showOlder: !this.state.showOlder })}>{title}</h3>
        )}
        {((title !== 'Older') || (this.state.showOlder)) && (
          conversations.map(conversation => (
            <div key={conversation.id} className="conversationItem">
              {/* Render each conversation item */}
              <h4 style={{ marginBottom: '0' }}>
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
                          loading={this.state.editLoading}
                          secondary
                        />
                      </div>
                      <Icon
                        name='check'
                        className='saveIcon'
                        style={{ cursor: 'pointer', color: 'grey' }}
                        onClick={() => this.handleSaveEditing(conversation.id)}
                        title='Save'
                      />
                      <Icon
                        name='cancel'
                        className='cancelIcon'
                        style={{ cursor: 'pointer', color: 'grey' }}
                        onClick={this.handleCancelEditing}
                        title='Cancel'
                      />
                    </div>
                  </Form>
                ) : (
                  <div>
                    <Menu.Item as={Link} to={'/conversations/' + conversation.id} onClick={() => this.props.resetChat()}>
                      <div style={{ display: 'flex' }}>
                        <Link to={'/conversations/' + conversation.id} style={linkStyle}>
                          {conversation.title}
                        </Link>
                        <Icon
                          name='edit'
                          // id='editIcon'
                          // className='editIcon'
                          onClick={() => this.handleEditClick(conversation.id, conversation.title)}
                          title='Edit'
                          style={{display:'none'}}
                        />
                      </div>
                    </Menu.Item>
                  </div>
                )}
              </h4>
            </div>
          ))
        )}
      </div>
    );
  }

  render() {
    const { conversations } = this.props;
    const { currentPage, windowWidth, editLoading } = this.state;


    // Calculate conversations for current page
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

    const conversationCount = conversations.length;

    const linkStyle = {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'block',
      maxWidth: '100%',
      color: '#e4dfda',
    }

    const groupedConversations = this.groupConversationsByDate();

    return (
      <div>
        <h4 style={{ marginBottom: '0' }}>
          <div>
            <Menu.Item as={Link} to="/" onClick={() => this.props.resetChat()}>
              <div style={{ display: 'flex' }}>
                <p style={linkStyle}>
                  <Icon name='add' /> New Conversation
                </p>
              </div>
              {/* <Divider style={{ marginTop: '0.3em', marginBottom: '0.3em' }} /> */}
            </Menu.Item>
          </div>
        </h4>
        <div>
          {groupedConversations.today.length > 0 && this.renderConversationsSection("Today", groupedConversations.today)}
          {groupedConversations.yesterday.length > 0 && this.renderConversationsSection("Yesterday", groupedConversations.yesterday)}
          {groupedConversations.last7Days.length > 0 && this.renderConversationsSection("Last 7 Days", groupedConversations.last7Days)}
          {groupedConversations.last30Days.length > 0 && this.renderConversationsSection("Last 30 Days", groupedConversations.last30Days)}
          {groupedConversations.older.length > 0 && this.renderConversationsSection("Older", groupedConversations.older)}
        </div>
      </div>
    );
  }
}

module.exports = ConversationsList;
