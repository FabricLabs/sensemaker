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
      ratingMessageID: null,//id from the message rating
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      modalOpen : false,
      modalLoading : false,
      feedbackSent : false,
      feedbackFail : false,
      generatingReponse: false,
      reGeneratingReponse: false,
      groupedMessages: this.groupMessages(props.chat.messages),
      currentDisplayedMessage: {}, // state to store the answer that has to be showed (in case of regenerated answers)
      //specific flag to use when you come from a previous conversation wich last submitted message was from user, to not show "jeeves is generationg reponse..."
      previousFlag: false,  
      connectionProblem: false,
      copiedStatus: {},
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

    const prevLastMessage = prevProps.chat.messages[prevProps.chat.messages.length - 1];
    const currentLastMessage = messages[messages.length - 1];

    if ((prevProps.chat.messages.length !== messages.length) || 
        (prevLastMessage && currentLastMessage && prevLastMessage.content !== currentLastMessage.content)  ) {
      const newGroupedMessages = this.groupMessages(this.props.chat.messages);
      this.setState({ groupedMessages: newGroupedMessages });
      // Set hasSubmittedMessage to true if a message has been submitted
      if (!this.props.hasSubmittedMessage) {
        this.props.updateHasSubmittedMessage(true);
      }
      if (messages && messages.length > 0){
        const lastMessage = messages[messages.length - 1];   

        if (lastMessage && lastMessage.role && lastMessage.role === 'assistant' && lastMessage.status !== 'computing') {
          this.setState({ generatingReponse: false });
          this.setState({ reGeneratingReponse: false });
        } else {
          //this is to add generating reponse after an user submitted message but not when you are in a historic conversation with last message from user
          if(!this.props.previousChat || (this.state.previousFlag && this.props.previousChat)){
            this.setState({ generatingReponse: true });
          }
        }
      }
      this.scrollToBottom();
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

  handleModalUp = (messageID) => {
    
    this.setState({ 
      modalOpen: true, 
      thumbsDownClicked : false, 
      thumbsUpClicked : true,
      ratingMessageID: messageID,
    });
  };

  handleModalDown = (messageID) => {
    this.setState({ 
      modalOpen: true, 
      thumbsDownClicked : true, 
      thumbsUpClicked : false,
      ratingMessageID: messageID,
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
    const messageId = this.state.ratingMessageID;
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
  renderFeedbakcModal = () =>{

    const { 
      modalOpen, 
      rating, 
      feedbackSent, 
      feedbackFail, 
      connectionProblem, 
      modalLoading,
    } = this.state;

    return (
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
          <Rating size={35} transition={true} onClick={this.handleRatingChange} initialValue={rating} />
          <Form.Field>
            <Header style={{ marginTop: '0.5em' }}>Comment</Header>
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
    )
  }

  regenerateAnswer = (event) => {
    const { messages } = this.props.chat;

    event.preventDefault();
    const { query } = this.state;
    const { message } = this.props.chat;
    const { caseTitle, caseID } = this.props;
    let dataToSubmit;
    this.setState({ reGeneratingReponse: true });
    this.setState({ loading: true, previousFlag: true, });
    const messageRegen = messages[this.props.chat.messages.length - 2];
    //scrolls so it shows the regenerating message
    this.scrollToBottom();

    if (caseID) {
      dataToSubmit = {
        conversation_id: message?.conversation,
        content: messageRegen.content,
        case: caseTitle + '_' + caseID,
        messageID: messageRegen.id
      }
    } else {
      if (!this.props.previousChat) {
        dataToSubmit = {
          conversation_id: message?.conversation,
          content: messageRegen.content,
          messageID: messageRegen.id
        }
      } else {
        dataToSubmit = {
          conversation_id: this.props.conversationID,
          content: messageRegen.content,
          messageID: messageRegen.id
        }
      }
    }
    // dispatch submitMessage
    this.props.regenAnswer(
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


  groupMessages = (messages) => {
    let groupedMessages = [];
    let currentGroup = [];

    messages.forEach((message, index) => {
      if (message.role === 'assistant') {
        currentGroup.push(message);
        // If next message is not from assistant, push current group to groupedMessages
        if (!messages[index + 1] || messages[index + 1].role !== 'assistant') {
          groupedMessages.push({
            messages: currentGroup,
            activeMessageIndex: currentGroup.length - 1 // last message is active by default
          });
          currentGroup = [];
        }
      } else {
        groupedMessages.push({
          messages: [message],
          activeMessageIndex: 0 // only one message in this group
        });
      }
    });
    this.setState({ groupedMessages: groupedMessages })
    return groupedMessages;
  };

  //function to navigate through responses from same question
  navigateMessage = (groupIndex, direction) => {
    this.setState(prevState => {
      const newGroupedMessages = [...prevState.groupedMessages];
      const group = newGroupedMessages[groupIndex];
      const newActiveIndex = Math.max(0, Math.min(group.activeMessageIndex + direction, group.messages.length - 1));
      group.activeMessageIndex = newActiveIndex;
      return { groupedMessages: newGroupedMessages };
    });
  }

  copyToClipboard = (messageID, htmlContent) => {
    // Create a temporary DOM element to parse the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Extract text from the HTML content
    const textToCopy = tempDiv.textContent || tempDiv.innerText || '';

    // Copy the extracted text to the clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log('Text copied to clipboard');
      //this is to show the popup message of "copied..." only in the message we actually clicked
      this.setState(prevState => ({
        copiedStatus: {
          ...prevState.copiedStatus,
          [messageID]: true,
        }
      }));

      // Reset the copied status after a delay
      setTimeout(() => {
        this.setState(prevState => ({
          copiedStatus: {
            ...prevState.copiedStatus,
            [messageID]: false,
          }
        }));
      }, 2000);
      console.log('Text copied to clipboard');
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  render () {
    const {
      loading,
      generatingReponse,
      reGeneratingReponse,
      query
    } = this.state;

    const {
      isSending,
      placeholder,
      messageContainerStyle,
      inputStyle,
      homePage
    } = this.props;

    const controlsStyle =  {border: 'none', backgroundColor: 'transparent', boxShadow: 'none', paddingRight: '0.5em', paddingLeft: '0.5em'} 
    const { messages } = this.props.chat;
    console.log("mensajes", messages);
    return (
      <div>
        <Feed style={messageContainerStyle} className='chat-feed'>
          {(this.props.includeFeed && messages && messages.length > 0) && this.state.groupedMessages.map((group, groupIndex) => {
            let message;
            //here it checks if the group message rendering is from assistant and if it has more than 1 message (because regenerated answers)
            if (group.messages[0].role === 'assistant' && group.messages.length > 1) {
              //this is the active answer the user selected to read
              message = group.messages[group.activeMessageIndex];
            } else {
              message = group.messages[0];
            }
            return (
              <Feed.Event key={message.id} data-message-id={message.id}>
                <Feed.Content>
                  {message.role === 'assistant' && (
                    <div className='controls thumbs-group'>
                      <Button.Group size='mini'>
                        <Popup trigger={
                          <Button icon='thumbs down' color='black' size='tiny' onClick={() => this.handleModalDown(message.id)} />
                        }>
                          <Popup.Content>
                            <p>Report something wrong with this statement.</p>
                          </Popup.Content>
                        </Popup>
                        <Popup trigger={
                          <Button icon='thumbs up' color='green' onClick={() => this.handleModalUp(message.id)} />
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
                    {(message.status !== 'computing') &&
                      <span dangerouslySetInnerHTML={{ __html: marked.parse(message.content || '') }} />
                    }
                  </Feed.Extra>
                  <Feed.Extra text>
                    {(generatingReponse && message.id === messages[messages.length - 1].id && !reGeneratingReponse) && (
                      <Header size='small' style={{ fontSize: '1em', marginTop: '1.5em' }}><Icon name='spinner' loading /> Jeeves is generating a response</Header>
                    )}
                    {(reGeneratingReponse && group === this.state.groupedMessages[this.state.groupedMessages.length - 1]) && (
                      <Header size='small' style={{ fontSize: '1em', marginTop: '1.5em' }}><Icon name='spinner' loading /> Jeeves is regenerating the response</Header>
                    )}
                    <div className='answer-controls' text>
                      {/* Navigation Controls */}
                      {group.messages.length > 1 && (
                        <div className="answers-navigation">
                          <Button 
                            icon='angle left'
                            size='tiny'
                            style={controlsStyle}
                            basic
                            onClick={() => this.navigateMessage(groupIndex, -1)}
                            disabled={group.activeMessageIndex === 0} />
                          <span style={{ fontWeight: 'bold', color: 'grey' }}>{`${group.activeMessageIndex + 1} / ${group.messages.length}`}</span>
                          <Button 
                            icon='angle right'
                            size='tiny'
                            style={controlsStyle}
                            basic
                            onClick={() => this.navigateMessage(groupIndex, 1)}
                            disabled={group.activeMessageIndex === group.messages.length - 1} />
                        </div>
                      )}
                      {/* the regenerate answer button only shows in the last answer */}
                      {(group === this.state.groupedMessages[this.state.groupedMessages.length - 1] && message.role === 'assistant' && !reGeneratingReponse && !generatingReponse) && (
                        <Popup content='Regenerate this answer' trigger={
                          <Button
                            icon='redo'
                            onClick={this.regenerateAnswer}
                            style={controlsStyle}
                            size='tiny'
                          />}/>
                      )}
                      {message.role === 'assistant' && (
                        <Popup
                          content="Copied to clipboard"
                          on="click"
                          open={this.state.copiedStatus[message.id] || false}
                          trigger={
                            <Button
                              onClick={() => this.copyToClipboard(message.id, marked.parse(message.content))}
                              style={controlsStyle}
                              size='tiny'>
                              <Icon name='clipboard outline' />
                            </Button>}/>
                      )}
                    </div>
                  </Feed.Extra>
                </Feed.Content>
              </Feed.Event>
            )
          })}
        </Feed>
        {/* <Form id="input-controls" size='big' onSubmit={this.handleSubmit.bind(this)} loading={loading} style={inputStyle}> */}
        <Form id="input-controls" size='big' onSubmit={this.handleSubmit.bind(this)} loading={loading} style={inputStyle}>
          <Form.Field>
            <Form.Input id='primary-query' fluid name='query' required placeholder={placeholder} onChange={this.handleChange} disabled={isSending} loading={isSending} value={query} />
          </Form.Field>
        </Form>
        {(messages.length === 0 && homePage) && (
          <container>
            <Header as='h3' style={{ textAlign: 'center', marginTop: '2em' }}>Chat suggestions you can try:</Header>
            <div className='home-dropdowns' onBlur={() => this.setState({ query: '' })}>
              <Dropdown
                size='small'
                placeholder='Find a case that...'
                selection
                text='Find a case that...'
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

        {this.renderFeedbakcModal()}
      </div>
    );
  }

  scrollToBottom = () => {
    //this timeout is used to make sure the scroll is done AFTER the component its updated and rendered, this fixes problems with generating reponse message
    setTimeout(() => {
      if (this.props.messagesEndRef.current) {
        const feedElement = this.props.messagesEndRef.current.querySelector('.chat-feed');
        const lastMessage = feedElement.lastElementChild;

        if (lastMessage) {
          lastMessage.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 0);
  };
}

module.exports = ChatBox;