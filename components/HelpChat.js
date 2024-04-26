'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Segment,
  Button,
  Icon,
  Input,
  Transition
} = require('semantic-ui-react');

class HelpChat extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      open: true,
      messageQuery: '',
      sending: false,
      conversation_id: 0, //this is used cause if we are in a new conversation, we update this during the proccess.
      loading: false,
    };
    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    const { conversationID } = this.props;

    if (conversationID) {
      this.setState({ conversation_id: conversationID });
      this.props.fetchHelpMessages(conversationID);
    }

    this.scrollToBottom();
  }

  componentDidUpdate = async (prevProps) => {
    const { help, conversationID } = this.props;
    //this updates the conversation_id state in case we switch help_conversations
    if (prevProps.conversationID != conversationID && !this.state.sending) {
      this.setState({ conversation_id: conversationID, loading: true });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.props.fetchHelpMessages(conversationID);
      this.setState({ loading: false });
    }
    if (prevProps.help != help) {
      console.log(help);
      if (!help.sending && help.sentSuccess && this.state.sending) {
        this.setState({ sending: false, conversation_id: help.conversation_id })
        this.props.fetchHelpMessages(help.conversation_id);
      }
    }
    if (prevProps.help.messages.length != help.messages.length) {
      this.scrollToBottom();
    }
  }

  // scrollToBottom = () => {
  //   setTimeout(() => {
  //     this.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //   }, 100);
  // }

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
      this.props.sendHelpMessage(messageQuery, conversation_id, 'user');
      this.setState({ messageQuery: '' });
    }
  };

  handleIconClick = () => {
    this.sendMessage();
  };

  render() {
    const { help } = this.props;
    return (
      <section style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Button icon style={{ position: 'absolute', backgroundColor: 'transparent' }} onClick={() => { this.props.closeHelpChat(); }}>
          <Icon name='chevron left' />
        </Button>
        {/* <div className='help-messages' style={{ flex: 1, overflowY: 'auto', paddingBottom: '1em' }} ref={this.messagesEndRef}> */}
        {/* <div className='help-chat-board' style={{ flex: 1, overflowY: 'auto', paddingBottom: '1em' }}> */}
        <Transition visible={!help.loadingMsgs}  animation='fade' duration={1000}>
          <div className='help-chat-feed' style={{ overflowY: 'auto', scrollBehavior: 'smooth' }} ref={this.messagesEndRef}>

            {(help && help.messages && help.messages.length > 0) ? (
              help.messages.map((instance) => (
                instance.help_role === 'user' ? (
                  <p id={instance.id} className='help-user-msg'>{instance.content}</p>
                ) : (
                  <p id={instance.id} className='help-admin-msg'>{instance.content}</p>
                )
              ))
            ) : (
              <p className='help-welcome-msg' >What can we do to help you? Tell us anything you need, an assistant will answer shortly.</p>
            )}
            {/* <div ref={this.messagesEndRef} /> */}
          </div>
        </Transition>
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

module.exports = HelpChat;