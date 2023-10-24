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
  constructor (props) {
    super(props);

    this.state = {
      hasSubmittedMessage: true,
    };

    this.messagesEndRef = React.createRef();
  }

  componentDidMount () {
    const { id } = this.props;
    const { message } = this.props.chat;

    // this.props.fetchConversation(id);
    this.props.getMessages({ conversation_id: id });
  }

  render () {
    const { id, loading, error, chat, messages } = this.props;

    const messageContainerStyle = this.state.hasSubmittedMessage ? {
      flexGrow: 1,
      paddingBottom: '3rem',
      transition: 'height 1s',
      overflowY: 'auto',
      transition: 'max-height 1s',
    } : {
      transition: 'height 1s',
      // paddingBottom: '5em',
      // height: '100%',
      
    };

    const componentStyle = this.state.hasSubmittedMessage ? {
      display: 'absolute',
      top: '1em',
      left: 'calc(350px + 1em)',
      maxHeight: 'calc(100vh - 3rem)', // Set a maximum height
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column', 
    } : {
      height: 'calc(100vh - 3rem)',
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
      left: '0',
      maxWidth: '80vw !important',
      position: 'relative',
    };    

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
       
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
         {/* <Button floated='right' onClick={this.handleClick.bind(this)}><Icon name='sync' /></Button> */}         
           <Header as='h2'>Conversation #{id}</Header>
           <ChatBox 
            {...this.props}
            chat={chat} messages={messages}
            messagesEndRef={this.messagesEndRef}
            includeFeed={true}
            messageContainerStyle={messageContainerStyle}
            inputStyle={inputStyle} 
            hasSubmittedMessage={this.state.hasSubmittedMessage}
            updateHasSubmittedMessage={(value) => this.setState({ hasSubmittedMessage: value })}
            previousChat={true}          
          />

       </fabric-component>
          

    );
  }
}

function Chat (props) {
  const { id } = useParams();
  return <Conversation id={id} {...props} />;
}

module.exports = Chat;
