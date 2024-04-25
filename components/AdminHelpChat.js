'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Segment,
  Button,
  Icon,
  Input
} = require('semantic-ui-react');

class AdminHelpChat extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      open: true,
      messageQuery: '',
      sending: false,
      conversation_id: 0, //this is used cause if we are in a new conversation, we update this during the proccess.
    };
    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    const { conversationID } = this.props;

    if (conversationID) {
      this.setState({ conversation_id: conversationID });
      this.props.fetchHelpMessages(conversationID,true); //second parameter as true for the admin flag
    }

    this.scrollToBottom();
  }

  componentDidUpdate(prevProps) {
    const { help, conversationID } = this.props;
    //this updates the conversation_id state in case we switch help_conversations
    if (prevProps.conversationID != conversationID && !this.state.sending) {
      this.setState({ conversation_id: conversationID });
      this.props.fetchHelpMessages(conversationID,true); //second parameter as true for the admin flag
      this.scrollToBottom();
    }
    if (prevProps.help != help) {
        if (!help.sending && help.sentSuccess && this.state.sending) {
        this.setState({ sending: false, conversation_id: help.conversation_id })
        this.props.fetchHelpMessages(help.conversation_id, true); //second parameter as true for the admin flag
        this.scrollToBottom();
      }
    }
    if (prevProps.help.admin_messages.length != help.admin_messages.length) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    const messagesContainer = this.messagesEndRef.current;
    if (messagesContainer) {
        // Scroll directly to the bottom by setting scrollTop to the scrollHeight
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      this.sendMessage();
      event.preventDefault();
    }
  };

  sendMessage = () => {
    const { messageQuery, conversation_id } = this.state;
    if (messageQuery !== '') {
      this.setState({ sending: true });
      console.log(messageQuery);
      this.props.sendHelpMessage(messageQuery, conversation_id, 'admin');
      this.setState({ messageQuery: '' });
    }
  };

  handleIconClick = () => {
    this.sendMessage();
  };

  render() {
    const { help } = this.props;
    const {conversation_id} = this.state;
    return (
      <section style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className='help-chat-feed' style={{ overflowY: 'auto', scrollBehavior: 'smooth'}} ref={this.messagesEndRef}>
          {(help && help.admin_messages && help.admin_messages.length > 0 && conversation_id != 0) ? (
            help.admin_messages.map((instance) => (
              instance.help_role === 'user' ? (
                <p id={instance.id} className='help-admin-msg'>{instance.content}</p>
              ) : (
                <p id={instance.id} className='help-user-msg'>{instance.content}</p>
              )
            ))
          ) : (
            <p className='help-welcome-msg' >What can we do to help you?</p>
          )}
        </div>
        <Input
          placeholder='Write your message...'
          name='messageQuery'
          onChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          value={this.state.messageQuery}
          icon
          style={{ flex: '0 0 auto', width: '100%' }}
        >
          <input />
          <Icon
            name='send'
            onClick={this.handleIconClick}
            style={{ cursor: 'pointer' }}
            link
          />
        </Input>

      </section>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = AdminHelpChat;