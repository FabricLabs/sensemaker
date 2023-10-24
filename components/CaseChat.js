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

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }

  handleClick = (e) => {
    console.debug('clicked reset button', e);
    this.props.resetChat();
    this.setState({ message: null, chat: { message: null } });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { query } = this.state;
    const { message } = this.props.chat;
    const { caseTitle, caseID } = this.props;

    this.setState({ loading: true });

    // dispatch submitMessage
    this.props.submitMessage({
      case_id: caseID,
      conversation_id: message?.conversation,
      content: query,
      case: caseTitle+'_'+caseID,
    }).then((output) => {
      // dispatch getMessages
      this.props.getMessages({ conversation_id: message?.conversation });

      if (!this.watcher) {
        this.watcher = setInterval(() => {
          this.props.getMessages({ conversation_id: message?.conversation });
        }, 15000);
      }

      this.setState({ loading: false });
    });

    // Clear the input after sending the message
    this.setState({ query: '' });
  }

  handleModalClose = () => {
    this.setState({ 
      modalOpen: false,
      thumbsDownClicked : false,
      thumbsUpClicked : false,
      rating : 0,
      comment : '',
      modalLoading: false,
      feedbackSent: false,
      feedbackFail: false
         
    });
  };

  handleModalUp = () => {
    this.setState({ 
      modalOpen: true, 
      thumbsDownClicked : false, 
      thumbsUpClicked : true 
    });
  };

  handleModalDown = () => {
    this.setState({ 
      modalOpen: true, 
      thumbsDownClicked : true, 
      thumbsUpClicked : false 
    });
  };

  handleRatingChange = (rate) => {
    this.setState({ rating: rate });    
  };

  handleCommentChange = (e, { value }) => {
    this.setState({ comment: value });
  }

  handleModalSend = () => {
    const { rating, comment, thumbsUpClicked, thumbsDownClicked } = this.state;
    const { message } = this.props.chat;
    const mssageId = message.id; 
    const state = store.getState();
    const token = state.auth.token;

    //data to send to the API
    const dataToSend = {
      rating,
      comment,
      thumbsUpClicked,
      thumbsDownClicked,
      message: mssageId      
    };
    
  
    //shows loading button
    this.setState({ modalLoading: true });    

    //artificial delay
    const delayPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });

    Promise.all([delayPromise, fetch('/reviews', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    })])
      .then(([delayResult, fetchResponse]) => {        
        if (delayResult === true) {
          if (fetchResponse.ok) {
            this.setState({feedbackSent : true, modalLoading: false });
          } else {
            this.setState({feedbackFail : true, modalLoading: false });
            console.error('API request failed');
          }
        }
      })
      .catch(error => {
        console.error('Error while sending data to the API:', error);
      })
  };


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
