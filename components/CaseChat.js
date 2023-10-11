'use strict';

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');

const store = require('../stores/redux');

// Semantic UI
const {
  Button,
  Card,
  Feed,
  Form,
  Header,
  Icon,
  Image,
  Input,
  Search,
  Modal,
  Message,
  TextArea,
  Popup
} = require('semantic-ui-react');

const {Rating} = require('react-simple-star-rating');

class CaseChat extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      query: '',
      hasSubmittedMessage: false,
      rating: 0, //user star rating
      comment: '', //user feedback comment
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      modalOpen : false,
      modalLoading : false,
      feedbackSent : false,
      feedbackFail : false
    };

    this.messagesEndRef = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount () {
    $('#primary-query').focus();
    this.props.resetChat();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.chat.messages.length !== this.props.chat.messages.length) {
      this.scrollToBottom();
      // Set hasSubmittedMessage to true if a message has been submitted
      if (!this.state.hasSubmittedMessage) {
        this.setState({ hasSubmittedMessage: true });
      }
    }
  }

  componentWillUnmount () {
    this.props.resetChat();
    clearInterval(this.watcher); //ends de sync in case you switch to other component

    this.setState({
      chat: {
        message: null,
        messages: []
      },
      conversations: [],
      message: null,
      messages: [],
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
    const {caseTitle , caseId} = this.props;


    this.setState({ loading: true });

    // dispatch submitMessage
    this.props.submitMessage({
      conversation_id: message?.conversation,
      content: query,
      case: caseTitle+'_'+caseId,
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
    const { loading } = this.state;
    const { isSending, placeholder } = this.props;
    const { message, messages } = this.props.chat;

    const messageContainerStyle = this.state.hasSubmittedMessage ? {
      flexGrow: 1,
      paddingBottom: '3rem',
      transition: 'height 1s',
      maxHeight: 'calc(60vh - 6rem)', // Set a maximum height
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
      bottom: '1em',
      right: '0em',
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
    };

    return (
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
        {/* <Button floated='right' onClick={this.handleClick.bind(this)}><Icon name='sync' /></Button> */}
        <Feed style={messageContainerStyle} className='chat-feed'>
          <Feed.Event>
            <Feed.Extra text>
              <Header>Can I help you with this case?</Header>
            </Feed.Extra>
          </Feed.Event>
          {this.props.includeFeed && messages && messages.length > 0 && messages.map(message => (
            <Feed.Event key={message.id}>
              <Feed.Content>
                {message.role === 'assistant' && (
                  <div style={{ float: 'right', display: 'none' }} className='controls'>
                    <Button.Group size='mini'>
                      <Popup trigger={
                        <Button icon='thumbs down' color='black' size='tiny' onClick={this.handleModalDown} />
                      }>
                        <Popup.Content>
                          <p>Report something wrong with this statement.</p>
                        </Popup.Content>
                      </Popup>
                      <Popup trigger={
                        <Button icon='thumbs up' color='green' onClick={this.handleModalUp} />
                      }>
                        <Popup.Header>Tell Us What You Liked!</Popup.Header>
                        <Popup.Content>
                          <p>We provide human feedback to our models, so you can annotate this message with a comment.</p>
                        </Popup.Content>
                      </Popup>
                    </Button.Group>
                  </div>
                )}
                <Feed.Summary>
                  <Feed.User>{message.author || message.user_id}</Feed.User>
                  <Feed.Date><abbr title={message.created_at}>{message.created_at}</abbr></Feed.Date>
                </Feed.Summary>
                <Feed.Extra text>
                  <span dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} />
                </Feed.Extra>
              </Feed.Content>
            </Feed.Event>
          ))}
          <Modal
            onClose={this.handleModalClose}
            onOpen={() => this.setState({ modalOpen: true })}
            open={this.state.modalOpen}            
            size='tiny'
          >
            <Modal.Header>Feedback</Modal.Header>
            <Modal.Content>              
              <Modal.Description>            
                <p>Let us know your opinion!</p>         
              </Modal.Description>            
              <Form>
              <Rating size={25} transition={true} onClick={this.handleRatingChange} initialValue={this.state.rating}/>
              <Form.Field>
              <Header style={{ marginTop: '0.5em'}}>Comment</Header>
              <TextArea
                placeholder='Enter your comment...'
                onChange={this.handleCommentChange}             
              />
              </Form.Field>
              </Form>
            </Modal.Content>
            <Modal.Actions> 
              {/*When the feedback is sent it shows this message  */}
              {this.state.feedbackSent && (
                <Message positive>
                  <Message.Header>Feedback Sent!</Message.Header>
                  <p>Your comment has been successfully sent.</p>
                </Message>
              )}
              {/*When the feedback could not be sent it shows this message  */}
              {this.state.feedbackFail && (
                <Message error> 
                  <Message.Header>Feedback could not be sent</Message.Header>
                  <p>Please try again later.</p>
                </Message>
              )}               
              <Button
                 content="Close"                  
                 icon='close'
                 onClick={this.handleModalClose}
                 labelPosition='right'
                 size='small'
                 secondary
             />
             {/*This button is shown only if Feedback wasnt sent yet */}
             {!this.state.feedbackSent && (
              <Button
                 content="Send"
                 icon={this.state.modalLoading ? 'spinner' : 'checkmark'}
                 onClick={this.handleModalSend}
                 labelPosition='right'    
                 size='small'     
                 loading={this.state.modalLoading}         
                 positive                 
               />)}                
            </Modal.Actions>
          </Modal>
        </Feed>
        <Form id="input-controls" size='big' onSubmit={this.handleSubmit.bind(this)} loading={loading} style={inputStyle}>
          <Form.Field>
            <Form.Input id='primary-query' fluid name='query' required placeholder={placeholder} onChange={this.handleChange} disabled={isSending} loading={isSending} value={this.state.query} />
          </Form.Field>
        </Form>
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