'use strict';

const React = require('react');
const { useParams } = require('react-router-dom');
const ChatBox = require('./ChatBox');

class DocumentNewChat extends React.Component {
  constructor(props) {
    super(props);

    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {

    // this.props.fetchConversation(id);
    this.props.resetChat();
    this.props.fetchDocument(this.props.fabric_id);
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (this.props.fabric_id !== prevProps.fabric_id) {
      this.props.resetChat();
      this.props.fetchDocument(this.props.fabric_id);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);

  }
  handleResize = () => {
    // Force a re-render when the window resizes
    this.forceUpdate();
  };

  render() {
    const { chat, messages, matterID, matters } = this.props;

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
          placeholder={'Ask me anything about this document...'}
          documentChat={true}
        />
      </fabric-component>
    );
  }
}

function DocumentConversation(props) {
  const { id } = useParams();
  return <DocumentNewChat fabric_id={id} {...props} />;
}

module.exports = DocumentConversation;