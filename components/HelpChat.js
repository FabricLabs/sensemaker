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

class HelpChat extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      open: true,
      messageQuery: '',
      sending: false,
      conversation_id: 0, //this is used cause if we are in a new conversation, we update this during the proccess.
    };
  }

  componentDidMount() {
    const { conversationID } = this.props;

    if (conversationID) {
      this.setState({ conversation_id: conversationID });
      this.props.fetchHelpMessages(conversationID);
    }
  }

  componentDidUpdate(prevProps) {
    const { help } = this.props;
    //this updates the conversation_id state in case we switch help_conversations
    if (prevProps.help.conversationID != help.conversationID && !this.state.sending) {
      this.setState({ conversation_id: conversationID });
      this.props.fetchHelpMessages(conversationID);
    }
    if (prevProps.help != help) {
      console.log(help);
      if (!help.sending && help.sentSuccess && this.state.sending) {
        this.setState({ sending: false, conversation_id: help.conversation_id })
        this.props.fetchHelpMessages(help.conversation_id);
      }
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
        <div className='help-messages' style={{ flex: 1, overflowY: 'auto' }}>
          {(help && help.messages && help.messages.length > 0) ? (
            help.messages.map((instance) => (
              instance.help_role === 'user' ? (
                <p id={instance.id} className='help-user-msg'>{instance.content}</p>
              ) : (
                <p id={instance.id} className='help-admin-msg'>{instance.content}</p>
              )
            ))
          ) : (
            <p>What can we do to help you?</p>
          )}
        </div>
        {/* <Input
          icon={{ name: 'send', onClick: this.handleIconClick, style: { cursor: 'pointer' } }}
          placeholder='Write your message...'
          name='messageQuery'
          onChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          value={this.state.messageQuery}
          style={{ flex: '0 0 auto', width: '100%' }}
        /> */}
        <Input
          placeholder='Write your message...'
          name='messageQuery'
          onChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          value={this.state.messageQuery}
          icon  // Indicates that there is an icon inside the input
          style={{ flex: '0 0 auto', width: '100%' }}
        >
          <input />
          <Icon
            name='send'
            onClick={this.handleIconClick}
            style={{ cursor: 'pointer' }}
            link  // Makes the icon behave like a clickable link
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
