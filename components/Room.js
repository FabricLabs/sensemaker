'use strict';

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Card,
  Header,
  Segment
} = require('semantic-ui-react');

const QueryForm = require('./QueryForm');
const ChatBox = require('./ChatBox');
const Feed = require('./Feed');

class Conversation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      actualConversation: null,
    };

    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    this.fetchData(this.props.id);
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    // Check if the conversation ID has changed
    if (this.props.id !== prevProps.id) {
      this.props.resetChat();
      this.fetchData(this.props.id);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  fetchData(id) {
    // Assuming you have a method to fetch a conversation by ID
    const actual = this.props.conversations.find(conversation => conversation.id == id);
    this.setState({ actualConversation: actual });

    // Fetch new conversation details and messages
    this.props.getMessages({ conversation_id: id });
  }

  // componentDidMount () {
  //   const { id } = this.props;
  //   const { message } = this.props.chat;

  //   const actual = this.props.conversations.find(conversation => conversation.id == id);
  //   this.setState({actualConversation: actual});

  //   // this.props.fetchConversation(id);
  //   this.props.getMessages({ conversation_id: id });
  //   window.addEventListener('resize', this.handleResize);
  // }

  // componentWillUnmount () {
  //   window.removeEventListener('resize', this.handleResize);

  // }
  handleResize = () => {
    // Force a re-render when the window resizes
    this.forceUpdate();
  };

  render() {
    const { id, chat, messages } = this.props;

    const componentStyle = {
      display: 'absolute',
      top: '1em',
      left: 'calc(350px + 1em)',
      height: 'calc(100vh - 2.5rem)', // Set a maximum height
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '0'
    };

    return (
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
        <ChatBox
          {...this.props}
          chat={chat} messages={messages}
          messagesEndRef={this.messagesEndRef}
          includeFeed={true}
          placeholder={'Ask me anything...'}
          previousChat={true}
          conversationID={id}
          actualConversation={this.state.actualConversation}
        />
      </fabric-component>

    );
  }
}

function Chat(props) {
  const { id } = useParams();
  return <Conversation id={id} {...props} />;
}

module.exports = Chat;