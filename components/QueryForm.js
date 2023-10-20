'use strict';

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');

const store = require('../stores/redux');
const ChatBox = require('./ChatBox');

// Semantic UI
const {
  Header,
  Image, 
  Feed,  
} = require('semantic-ui-react');


class Chat extends React.Component {
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
      // bottom: '10em',
      // right: '1em',
      // left: '1em',
      // height: 'auto',
      position: 'relative',
    };
    

    return (
     
       <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
         {/* <Button floated='right' onClick={this.handleClick.bind(this)}><Icon name='sync' /></Button> */}
         <Feed.Extra text style={{ display: 'flex'}}>
            <Image src='/images/jeeves-brand.png' size='small' floated='left' />
            <div style={{ paddingTop: '4em',maxWidth: '10em' }}>
              <p><strong>Hello,</strong> I'm <abbr title="Yes, what about it?">JeevesAI</abbr>, your legal research companion.</p>
            </div>
          </Feed.Extra>
          <Header style={{ marginTop: '1em'}}>How can I help you today?</Header> 

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
}

module.exports = Chat;