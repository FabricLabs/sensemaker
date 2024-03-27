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
      recoveryFlag: false,
      recovering: false,
      file_fabric_id: null,
      documentInfo: null,
    };

    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    this.fetchData(this.props.id);
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) {
      this.setState({ recoveryFlag: true, recovering: false });
      this.fetchData(this.props.id);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  fetchData = async (id) => {
    // Assuming you have a method to fetch a conversation by ID
    const actual = this.props.conversations.find(conversation => conversation.id == id);
    this.setState({ actualConversation: actual });
    await this.props.resetChat();
    this.setState({ file_fabric_id: actual.file_fabric_id ? actual.file_fabric_id : null });
    if (actual.file_fabric_id) {
      await this.props.fetchDocument(this.props.fabric_id);
    }
    // Fetch new conversation details and messages
    await this.props.getMessages({ conversation_id: id });
  }

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
          resetInformationSidebar={this.props.resetInformationSidebar}
          messageInfo={this.props.messageInfo}
          thumbsUp={this.props.thumbsUp}
          thumbsDown={this.props.thumbsDown}
          chat={chat} messages={messages}
          messagesEndRef={this.messagesEndRef}
          includeFeed={true}
          placeholder={'Ask me anything...'}
          previousChat={true}
          conversationID={id}
          actualConversation={this.state.actualConversation}
          documentInfo={this.props.documents.document}
          documentInfoSidebar={this.props.documentInfoSidebar}
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