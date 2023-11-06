'use strict';

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');

const store = require('../stores/redux');
const {caseDropOptions,draftDropOptions,outlineDropOptions} = require('./SuggestionOptions');

// Semantic UI
const {
  Button,
  Feed,
  Form,
  Header,
  Icon,
  Modal,
  Message,
  TextArea,
  Popup,
  Dropdown  
} = require('semantic-ui-react');

const {Rating} = require('react-simple-star-rating');

class ChatBox extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      query: '',
      rating: 0, //user star rating
      comment: '', //user feedback comment
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      modalOpen : false,
      modalLoading : false,
      feedbackSent : false,
      feedbackFail : false,
      generatingReponse: false,
      //specific flag to use when you come from a previous conversation wich last submitted message was from user, to not show "jeeves is generationg reponse..."
      previousFlag: false,  
      connectionProblem: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChangeDropdown = this.handleChangeDropdown.bind(this);
  }

  componentDidMount () {
    $('#primary-query').focus();
    this.props.resetChat();
    this.props.updateHasSubmittedMessage(false);
  }

  componentDidUpdate (prevProps) {
    const { messages } = this.props.chat;
    if (prevProps.chat.messages.length !== this.props.chat.messages.length) {
      this.scrollToBottom();
      // Set hasSubmittedMessage to true if a message has been submitted
      if (!this.props.hasSubmittedMessage) {
        this.props.updateHasSubmittedMessage(true);
      }
      if (messages && messages.length > 0){
        const lastMessage = messages[messages.length - 1];      
        if (lastMessage && lastMessage.role && lastMessage.role === 'assistant') {
          this.setState({ generatingReponse: false });
        } else {
          //this is to add generating reponse after an user submitted message but not when you are in a historic conversation with last message from user
          if(!this.props.previousChat || (this.state.previousFlag && this.props.previousChat)){
            this.setState({ generatingReponse: true });
          }
        }
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
    });
    this.props.updateHasSubmittedMessage(false);
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }
  handleChangeDropdown = (e, { name, value }) => {
    if(value!=''){
      this.setState({ query: value });     
      const { message } = this.props.chat;  
      let dataToSubmit;
      
      this.setState({ loading: true });

        dataToSubmit = {
          conversation_id: message?.conversation,
          content: value,        
        }  

      // dispatch submitMessage
      this.props.submitMessage(
        dataToSubmit
      ).then((output) => {

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
    const {caseTitle , caseID} = this.props;
    let dataToSubmit;
    
    this.setState({ loading: true, previousFlag: true });    

    if(caseID){
      dataToSubmit = {
        conversation_id: message?.conversation,
        content: query,
        case: caseTitle+'_'+caseID,
      }
    }else{
      if(!this.props.previousChat){
        dataToSubmit = {
          conversation_id: message?.conversation,
          content: query,
        }        
      }else{
        dataToSubmit = {
          conversation_id: this.props.conversationID,
          content: query,
        }        
      }
    }   
    // dispatch submitMessage
    this.props.submitMessage(
      dataToSubmit
    ).then((output) => {

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
      feedbackFail: false,
      connectionProblem: false
         
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
  
  handleModalSend = async () => {
    const { rating, comment, thumbsUpClicked, thumbsDownClicked } = this.state;
    const { message } = this.props.chat;
    const messageId = message.id;
    const state = store.getState();
    const token = state.auth.token;
  
    const dataToSend = {
      rating,
      comment,
      thumbsUpClicked,
      thumbsDownClicked,
      message: messageId,
    };
  
    this.setState({ modalLoading: true });
  
    const fetchPromise = fetch("/reviews", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch timed out"));
      }, 15000);
    });
    try {
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (response.ok) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        this.setState({
          feedbackSent: true,
          feedbackFail: false,
          modalLoading: false,
          connectionProblem: false,
        });
      } else {
        this.setState({
          feedbackSent: false,
          feedbackFail: true,
          modalLoading: false,
          connectionProblem: false,
        });        
        console.error("API request failed with status:", response.status);
      }    

    } catch (error) {
      if (error.message === "Fetch timed out") {
        this.setState({
          feedbackSent: false,
          feedbackFail: false,
          modalLoading: false,
          connectionProblem: true,
        });
      } 
    }
  };


  render () {
    
    const { 
      loading, 
      generatingReponse, 
      modalOpen, 
      rating, 
      feedbackSent, 
      feedbackFail, 
      connectionProblem, 
      modalLoading,
      query 
    } = this.state;

    const { 
      isSending, 
      placeholder,
      messageContainerStyle,
      inputStyle, 
      homePage
    } = this.props;

    const { message, messages } = this.props.chat;   
    
    return (
        <div>
            <Feed style={messageContainerStyle} className='chat-feed'>
                {this.props.includeFeed && messages && messages.length > 0 && messages.map(message => (
                    <Feed.Event key={message.id}>
                    <Feed.Content>
                        {message.role === 'assistant' && (
                        <div className='controls thumbs-group'>
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
                    open={modalOpen}            
                    size='tiny'>
                    <Modal.Header>Feedback</Modal.Header>
                    <Modal.Content>              
                    <Modal.Description>            
                        <p>Let us know your opinion!</p>         
                    </Modal.Description>            
                    <Form>
                        <Rating size={25} transition={true} onClick={this.handleRatingChange} initialValue={rating}/>
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
                    {feedbackSent && (
                        <Message positive>
                            <Message.Header>Feedback Sent!</Message.Header>
                            <p>Your comment has been successfully sent.</p>
                        </Message>
                    )}
                    {/*When the feedback could not be sent it shows this message  */}
                    {feedbackFail && (
                        <Message error> 
                            <Message.Header>Feedback could not be sent</Message.Header>
                            <p>Please try again later.</p>
                        </Message>
                    )}
                    {connectionProblem && (
                        <Message error> 
                            <Message.Header>Feedback could not be sent</Message.Header>
                            <p>Please check your internet connection.</p>
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
                    {!feedbackSent && (
                    <Button
                        content="Send"
                        icon={modalLoading ? 'spinner' : 'checkmark'}
                        onClick={this.handleModalSend}
                        labelPosition='right'    
                        size='small'     
                        loading={modalLoading}         
                        positive                 
                    />)}                
                    </Modal.Actions>
                </Modal>
            </Feed>
            {/* <Form id="input-controls" size='big' onSubmit={this.handleSubmit.bind(this)} loading={loading} style={inputStyle}> */}
            <Form id="input-controls" size='big' onSubmit={this.handleSubmit.bind(this)} loading={loading} style={inputStyle}>
            {generatingReponse && (
                <Message size='tiny' style={{ float: 'right'}}>
                <Message.Header style={{ fontSize: '0.8em' }}><Icon name='spinner' loading /> Jeeves is generating a response...</Message.Header>                
                </Message>)}
            <Form.Field>
                <Form.Input id='primary-query' fluid name='query' required placeholder={placeholder} onChange={this.handleChange} disabled={isSending} loading={isSending} value={query} />
            </Form.Field>            
            </Form>
            {(messages.length === 0 && homePage) && (        
               <container >           
                <Header as='h3' style={{textAlign: 'center', marginTop:'2em'}}>Chat suggestions you can try:</Header> 
                <div className='home-dropdowns' onBlur={() => this.setState({ query: '' })}>
                 <Dropdown
                  size='small'
                  placeholder='Find all case that...'  
                  selection       
                  text='Find all case that...'                                    
                  options={caseDropOptions}
                  onChange={this.handleChangeDropdown}                         
                 />              
                 <Dropdown
                  size='small'
                  placeholder='Draft a brief...'  
                  selection
                  text='Draft a brief...' 
                  options={draftDropOptions}
                  onChange={this.handleChangeDropdown}                   
                 />
                 <Dropdown
                  size='small'
                  placeholder='Outline a motion...'                  
                  selection
                  text='Outline a motion...'                  
                  options={outlineDropOptions}
                  onChange={this.handleChangeDropdown}                   
                 />
                 </div>
                </container>
              )}
        </div>
    );
  }

  scrollToBottom = () => {
    if (this.props.messagesEndRef.current) {
      const feedElement = this.props.messagesEndRef.current.querySelector('.chat-feed');
      const lastMessage = feedElement.lastElementChild;
  
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
}

module.exports = ChatBox;