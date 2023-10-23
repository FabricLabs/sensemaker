'use strict';

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');

const store = require('../stores/redux');
const ChatBox = require('./ChatBox');


// Semantic UI
const {  
  Feed,
  Header,
} = require('semantic-ui-react');

class CaseChat extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      hasSubmittedMessage: false,
    };

    this.messagesEndRef = React.createRef();
  }

  componentDidMount () {
    $('#primary-query').focus();
    this.props.resetChat();
  } 

  componentWillUnmount () {
    this.setState({
      hasSubmittedMessage: false,
    });
  }

  render () {
    const { loading, generatingReponse } = this.state;
    const { isSending, placeholder } = this.props;
    const { message, messages } = this.props.chat;

    const messageContainerStyle = this.state.hasSubmittedMessage ? {
      flexGrow: 1,
      paddingBottom: '3rem',
      transition: 'height 1s',
      height: 'auto',
      overflowY: 'auto',
      transition: 'max-height 1s',

    } : {
      transition: 'height 1s',
      paddingBottom: '5em',
      height: '100%',
      
    };

    const componentStyle = this.state.hasSubmittedMessage ? {
      top: '1em',
      left: 'calc(350px + 1em)',
      maxHeight: 'calc(60vh - 4rem)', // Set a maximum height
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',      
    } : {
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',  
    };

    const inputStyle = this.state.hasSubmittedMessage ? {
      position: 'fixed',
      bottom: '1.25em',
      right: '1.25em',
      left: 'calc(350px + 1.25em)',
      paddingRight: '1.5rem'
    } : {
      bottom: '1em',
      right: '1em',
      left: '1em',
      height: 'auto',
      position:'absolute'
    };

    return (
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
        {/* <Button floated='right' onClick={this.handleClick.bind(this)}><Icon name='sync' /></Button> */}
          <Feed.Extra text style={{ paddingBottom: '2em'}}>
            <Header>Can I help you with this case?</Header>
          </Feed.Extra>

          <ChatBox 
            {...this.props}   
            messageContainerStyle={messageContainerStyle}
            inputStyle={inputStyle} 
            hasSubmittedMessage={this.state.hasSubmittedMessage}
            updateHasSubmittedMessage={(value) => this.setState({ hasSubmittedMessage: value })}
            placeholder={this.props.placeholder}
            messagesEndRef={this.messagesEndRef}
            />        
      </fabric-component>
    );
  }

  scrollToBottom = () => {
    if (this.messagesEndRef.current) {
      const feedElement = this.messagesEndRef.current.querySelector('.chat-feed');
      const lastMessage = feedElement.lastElementChild;
  
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
}

module.exports = CaseChat;