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

    this.messagesEndRef = React.createRef();
  }

  componentDidMount () {
    $('#primary-query').focus();
    this.props.resetChat();
    window.addEventListener('resize', this.handleResize);
  } 

  componentWillUnmount () {

    window.removeEventListener('resize', this.handleResize);
  }
  handleResize = () => {
    // Force a re-render when the window resizes
    this.forceUpdate();
  };

  render () {
    
    const { messages } = this.props.chat;
    const componentStyle = messages.length>0 ? {
      top: '1em',
      left: 'calc(350px + 1em)',
      height: 'calc(60vh - 3rem)', // Set a maximum height
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

    return (
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
          <ChatBox 
            {...this.props}  
            placeholder={'Ask me anything about this case...'}
            messagesEndRef={this.messagesEndRef}
            />        
      </fabric-component>
    );
  }  
}

module.exports = CaseChat;