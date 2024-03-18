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
  Segment
} = require('semantic-ui-react');

class CaseChat extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight
    };

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
    this.setState({ windowHeight: window.innerHeight,});
    this.forceUpdate();
  };

  render () {

    const {windowHeight} = this.state;
    const { messages } = this.props.chat;

    const componentStyle = messages.length>0 ? {
      top: '1em',
      left: 'calc(350px + 1em)',
      // height: 'calc(60vh - 3rem)', // Set a maximum height
      //height: windowHeight < 1200? 'calc(60vh - 2.5rem)' : 'calc(80vh - 2.5rem)',
    //  height: '30vh',
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '0',
      width: '100%',
    } : {
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',

    };



    return (
      <Segment ref={this.messagesEndRef} style={componentStyle}>
          <ChatBox
            {...this.props}
            placeholder={'Ask me anything about this case...'}
            messagesEndRef={this.messagesEndRef}
            />
      </Segment>
    );
  }
}

module.exports = CaseChat;