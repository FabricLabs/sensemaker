'use strict';

const {
  BRAND_NAME,
  ENABLE_BILLING
} = require('../constants');

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');
const hark = require('hark');

const toRelativeTime = require('../functions/toRelativeTime');

const { caseDropOptions, draftDropOptions, outlineDropOptions } = require('./SuggestionOptions');
const InformationSidebar = require('./InformationSidebar');

const { Link, useParams } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Container,
  Dropdown,
  Feed,
  Form,
  Grid,
  GridColumn,
  Header,
  Icon,
  Input,
  Message,
  Popup,
  Progress,
  Segment
} = require('semantic-ui-react');

const TextareaAutosize = require('react-textarea-autosize').default;

class ChatBox extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({}, props);

    this.state = {
      query: '',
      generatingReponse: false,
      reGeneratingReponse: false,
      groupedMessages: (props.chat.messages.length > 0) ? this.groupMessages(props.chat.messages) : [],
      currentDisplayedMessage: {}, // state to store the answer that has to be showed (in case of regenerated answers)
      //specific flag to use when you come from a previous conversation wich last submitted message was from user, to not show "jeeves is generationg reponse..."
      previousFlag: false,
      connectionProblem: false,
      copiedStatus: {},
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      checkingMessageID: 0,//id from the message rating
      informationSidebarOpen: false,
      resetInformationSidebar: false,
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      isTextareaFocused: false, //this is needed to work on the microphone icon color
      editedTitle: '',
      editLoading: false,
      editingTitle: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChangeDropdown = this.handleChangeDropdown.bind(this);
  }

  componentDidMount() {
    $('#primary-query').focus();
    //this.props.resetChat();
    if(this.props.conversationID){
      this.startPolling(this.props.conversationID);
    }
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    const { messages } = this.props.chat;

    const prevLastMessage = prevProps.chat.messages[prevProps.chat.messages.length - 1];
    const currentLastMessage = messages[messages.length - 1];
    if (this.props.conversationID)
      if (this.props.conversationID !== prevProps.conversationID) {
        this.stopPolling();
        this.startPolling(this.props.conversationID);
      }

    // we go this way if we have more messages than before or if the content of the last message
    // changed, this happens when the last message from assistant changes from "jeeves is researching..." to the actual answer
    if ((prevProps.chat.messages.length !== messages.length) ||
      (prevLastMessage && currentLastMessage && prevLastMessage.content !== currentLastMessage.content)) {
      const newGroupedMessages = this.groupMessages(this.props.chat.messages);
      this.setState({ groupedMessages: newGroupedMessages });

      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.role && lastMessage.role === 'assistant' && lastMessage.status !== 'computing') {
          this.setState({ generatingReponse: false });
          this.setState({ reGeneratingReponse: false });
          this.props.getMessageInformation(lastMessage.content);

        } else {
          //this is to add generating reponse after an user submitted message but not when you are in a historic conversation with last message from user
          if (!this.props.previousChat || (this.state.previousFlag && this.props.previousChat)) {
            this.setState({ generatingReponse: true });
          }
        }
      }
      this.scrollToBottom();
    }
  }

  

  componentWillUnmount() {
    //this.props.resetChat();
    //clearInterval(this.watcher); //ends de sync in case you switch to other component
    this.stopPolling();

    this.setState({
      chat: {
        message: null,
        messages: []
      },
      conversations: [],
      message: null,
      messages: [],
    });

    window.removeEventListener('resize', this.handleResize);
  }

  stopPolling = () => {
    if (this.watcher) {
      clearInterval(this.watcher);
      this.watcher = null;
    }
  };

  startPolling = (id) => {
    // Ensure any existing polling is stopped before starting a new one
    this.stopPolling();

    // Start polling for messages in the current conversation
    this.watcher = setInterval(() => {
      this.props.getMessages({ conversation_id: id });
    }, 5000);
  };


  //these 2 works for the microphone icon color, they are necessary
  handleTextareaFocus = () => {
    this.setState({ isTextareaFocused: true });
  };

  handleTextareaBlur = () => {
    this.setState({ isTextareaFocused: false });
  };


  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth, windowHeight: window.innerHeight, });
  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }

  handleChangeDropdown = (e, { name, value }) => {
    if (value != '') {
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
          }, 5000);
        }

        this.setState({ loading: false });
      });

      // Clear the input after sending the message
      this.setState({ query: '' });
    }
  }

  handleClick = (e) => {
    console.debug('clicked reset button', e);
   // this.props.resetChat();
    this.setState({ message: null, chat: { message: null } });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { query } = this.state;
    const { message } = this.props.chat;
    const { caseTitle, caseID, matterID } = this.props;
    let dataToSubmit;

    this.stopPolling();
    
    this.setState({ loading: true, previousFlag: true });

    this.props.getMessageInformation(query);

    //if we have caseID its beacause we are on a specific case chat
    if (caseID) {
      dataToSubmit = {
        conversation_id: message?.conversation,
        content: query,
        case: caseTitle + '_' + caseID,
      }
    } else {
      //if we don't have previous chat it means this is a new conversation
      if (!this.props.previousChat) {
        dataToSubmit = {
          conversation_id: message?.conversation,
          content: query,
        }
      } else {
        //else, we are in a previous one and we already have a conversationID for this
        dataToSubmit = {
          conversation_id: this.props.conversationID,
          content: query,
        }
      }
    }

    const effectiveMatterID = matterID || this.props.actualConversation ? matterID || this.props.actualConversation.matter_id : null;


    // dispatch submitMessage
    this.props.submitMessage(
      dataToSubmit,
      effectiveMatterID
    ).then((output) => {

      // dispatch getMessages
      this.props.getMessages({ conversation_id: message?.conversation });

      if (!this.watcher) {
        this.watcher = setInterval(() => {
          this.props.getMessages({ conversation_id: message?.conversation });
        }, 5000);
      }
      this.setState({ loading: false });
    });

    // Clear the input after sending the message
    this.setState({ query: '' });
  }

  toggleInformationSidebar = () => {
    this.setState(prevState => ({
      informationSidebarOpen: !prevState.informationSidebarOpen
    }));
  };

  messageInfo = (ID) => {
    let newState = {
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      checkingMessageID: ID,
      informationSidebarOpen: true
    };

    // if sidebar is open and checkingMessageID === actual clicked message,
    // and none of thumbs was active, then closes sidebar (because it means you clicked "I"
    // icon twice for the same message)
    if (this.state.informationSidebarOpen && ID === this.state.checkingMessageID &&
      !this.state.thumbsUpClicked && !this.state.thumbsDownClicked) {
      newState.informationSidebarOpen = false;
    }

    this.setState(newState);
    this.setState(prevState => ({ resetInformationSidebar: !prevState.resetInformationSidebar }));

  };


  // thumbs up handler
  thumbsUp = (ID) => {
    this.setState({ thumbsDownClicked: false });

    // if thumbsUp was clicked for this message already, close sidebar
    if (this.state.thumbsUpClicked && this.state.checkingMessageID === ID) {
      this.setState({
        informationSidebarOpen: false,
        thumbsUpClicked: false,
        thumbsDownClicked: false
      });
    } else {
      //else, open (or keep open) sidebar, and fix states
      this.setState({
        thumbsUpClicked: true,
        thumbsDownClicked: false,
        checkingMessageID: ID,
        informationSidebarOpen: true
      });
    }
    this.setState(prevState => ({ resetInformationSidebar: !prevState.resetInformationSidebar }));

  };

  // thumbs down handler
  thumbsDown = (ID) => {
    this.setState({ thumbsUpClicked: false });
    // if thumbsDown was clicked for this message already, close sidebar
    if (this.state.thumbsDownClicked && this.state.checkingMessageID === ID) {
      this.setState({
        informationSidebarOpen: false,
        thumbsUpClicked: false,
        thumbsDownClicked: false
      });
    } else {
      //else, open (or keep open) sidebar, and fix states
      this.setState({
        thumbsUpClicked: false,
        thumbsDownClicked: true,
        checkingMessageID: ID,
        informationSidebarOpen: true
      });
    }
    this.setState(prevState => ({ resetInformationSidebar: !prevState.resetInformationSidebar }));
  };

  regenerateAnswer = (event) => {
    event.preventDefault();

    const { groupedMessages } = this.state;
    const { message } = this.props.chat;
    const { caseTitle, caseID } = this.props;

    this.stopPolling();

    let dataToSubmit;
    this.setState({ reGeneratingReponse: true, loading: true, previousFlag: true, });

    const messageRegen = groupedMessages[groupedMessages.length - 2].messages[0];

    //scrolls so it shows the regenerating message
    this.scrollToBottom();

    //if we have caseID its beacause we are on a specific case chat
    if (caseID) {
      dataToSubmit = {
        conversation_id: message?.conversation,
        content: messageRegen.content,
        case: caseTitle + '_' + caseID,
        id: messageRegen.id
      }
    } else {
      //if we don't have previous chat it means this is a new conversation
      if (!this.props.previousChat) {
        dataToSubmit = {
          conversation_id: message?.conversation,
          content: messageRegen.content,
          id: messageRegen.id
        }
        //else, we are in a previous one and we already have a conversationID for this
      } else {
        dataToSubmit = {
          conversation_id: this.props.conversationID,
          content: messageRegen.content,
          id: messageRegen.id
        }
      }
    }
    // dispatch submitMessage
    this.props.regenAnswer(dataToSubmit).then((output) => {
      // dispatch getMessages
      this.props.getMessages({ conversation_id: message?.conversation });

      if (!this.watcher) {
        this.watcher = setInterval(() => {
          this.props.getMessages({ conversation_id: message?.conversation });
        }, 5000);
      }

      this.setState({ loading: false });
    });

    // Clear the input after sending the message
    this.setState({ query: '' });
  }

  // Function to group answers to the same question
  groupMessages = (messages) => {
    let groupedMessages = [];
    let currentGroup = [];

    messages.forEach((message, index) => {
      if (message.role === 'assistant') {
        currentGroup.push(message);
        // If the next message is not from an assistant, push the current group to groupedMessages
        if (!messages[index + 1] || messages[index + 1].role !== 'assistant') {
          // Find the corresponding group in the previous state
          const prevGroup = this.state.groupedMessages.find(g => g.messages[0].id === currentGroup[0].id);
          let activeMessageIndex = currentGroup.length - 1; // last message is active by default

          // If a corresponding group is found and it has the same number of messages, retain the activeMessageIndex
          if (prevGroup && prevGroup.messages.length === currentGroup.length) {
            activeMessageIndex = prevGroup.activeMessageIndex;
          }

          groupedMessages.push({
            messages: currentGroup,
            activeMessageIndex: activeMessageIndex
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
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  handleMicrophoneClick = () => {
    console.debug('[NOVO]', 'Microphone click');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        console.debug('[NOVO]', 'Got audio stream:', stream);

        const recorder = new MediaRecorder(stream);
        const speaker = hark(stream, {});
        const chunks = [];

        speaker.on('silence', () => {
          console.debug('[NOVO]', 'Silence detected');
        });

        speaker.on('speaking', () => {
          console.debug('[NOVO]', 'Speaking detected');
        });

        speaker.on('stopped_speaking', () => {
          console.debug('[NOVO]', 'Speaking stopped');
          console.debug('[NOVO]', 'All chunks:', chunks);

          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();

          reader.onload = function () {
            console.debug('[NOVO]', 'Reader loaded:', reader.result);
            const recognition = new webkitSpeechRecognition();

            recognition.onresult = function (event) {
              console.debug('[NOVO]', 'Transcribed text:', event.results[0][0].transcript);
            };

            recognition.onnomatch = (event) => {
              console.debug('[NOVO]', 'No match:', event);
            }

            recognition.start();
            console.debug('[NOVO]', 'Recognition started...', recognition);
          }

          reader.readAsDataURL(blob);
          console.debug('[NOVO]', 'Reader is reading...', blob);
        });

        recorder.ondataavailable = (e) => {
          // console.debug('[NOVO]', 'Audio Chunk:', e.data);
          chunks.push(e.data);
        };

        recorder.start(1000);
        console.debug('[NOVO]', 'Recorder started:', recorder);
      }).catch((err) => {
        console.error(`The following getUserMedia error occurred: ${err}`);
      });
    } else {
      console.debug('getUserMedia not supported on your browser!');
    }
  }

  conversationTitle = (title) => {
    if (this.state.editingTitle) {
      return (
        <Form style={{ width: '90%', maxWidth: '600px' }}>
          <div className='conversation-line' >
            <div className='conversation-line-input'>
              <Input
                type="text"
                maxLength={255}
                value={this.state.editedTitle}
                onChange={(e) => this.setState({ editedTitle: e.target.value })}
                autoFocus
                fluid
                loading={this.state.editLoading}
                secondary
              />
            </div>
            <Icon
              name='check'
              className='saveIcon'
              style={{ cursor: 'pointer', color: 'grey' }}
              onClick={() => this.handleSaveEditing()}
              title='Save'
              disabled={this.state.editLoading}
            />
            <Icon
              name='cancel'
              className='cancelIcon'
              style={{ cursor: 'pointer', color: 'grey' }}
              onClick={this.handleCancelEditing}
              title='Cancel'
              disabled={this.state.editLoading}
            />
          </div>
        </Form>
      )
    }
    else {
      return (
        <div style={{ display: 'flex' }}>
          {this.state.editedTitle ? (
            <Header as="h2" style={{ marginBottom: '0.3em' }}>{this.state.editedTitle}</Header>
          ) : (
            <Header as="h2" style={{ marginBottom: '0.3em' }}>{title}</Header>
          )}
          <Icon
            name='edit'
            id='editTitleIcon'
            className='editTitleIcon'
            onClick={() => this.handleEditClick(title)}
            title='Edit Title'
            size='large'
            style={{ marginLeft: '1em', cursor: 'pointer', color: 'grey' }}
          />
        </div>
      )
    }
  }


  handleEditClick = (currentTitle) => {
    this.setState({ editingTitle: true, editedTitle: currentTitle });
  };

  handleSaveEditing = async () => {
    this.setState({ editLoading: true });
    //forced delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await this.props.conversationTitleEdit(this.props.conversationID, this.state.editedTitle);
    this.setState({ editingTitle: false, editLoading: false });
  };
  handleCancelEditing = () => {
    // Reset editing state without saving
    this.setState({ editingTitle: false, editedTitle: '' });
  };

  render() {
    const { messages } = this.props.chat;
    const {
      loading,
      generatingReponse,
      reGeneratingReponse,
      query,
      windowWidth,
      windowHeight,
      informationSidebarOpen,
      checkingMessageID
    } = this.state;

    const {
      isSending,
      placeholder,
      homePage,
      announTitle,
      announBody,
      caseID,
      conversationID,
      matterID,
      matterTitle,
      actualConversation,
    } = this.props;

    //this is the style of the chat container with no messages on the chat
    //the elements are on a flex-column but all together
    let chatContainerStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      transition: 'height 1s',
      width: '100%',
    }

    //when there are messages on the chat, it fits 98% of the parent height
    //and we put normally justify-content space-between, wich pushes the prompt bar to bottom
    //in cases where the screen is really tall (height > 1200px) and the screen is taller than wider
    //then we dont use space-between, this makes the prompt bar sticks to the last message of the chat
    if (messages.length > 0) {
      chatContainerStyle = {
        ...chatContainerStyle,
        height: '98%',
        justifyContent: (windowHeight < 1200 || windowHeight < windowWidth) ? 'space-between' : ''
      };
    }

    const messagesContainerStyle = {
      overflowY: 'auto',
      transition: 'height 1s',
      marginBottom: '0'
    }
    const announcementStyle = {
      minHeight: '5.5em',
      maxHeight: '14em',
      overflow: 'auto',
      // marginBottom: 0,
      marginTop: 0,
    };

    const controlsStyle = {
      border: 'none',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      paddingRight: '0.5em',
      paddingLeft: '0.5em',
      // maxWidth: 'none'
    };

    return (
      <section style={chatContainerStyle}>
        <Feed style={messagesContainerStyle} className="chat-feed">
          <InformationSidebar
            checkingMessageID={checkingMessageID}
            visible={informationSidebarOpen}
            toggleInformationSidebar={this.toggleInformationSidebar}
            resetInformationSidebar={this.state.resetInformationSidebar}
            thumbsUpClicked={this.state.thumbsUpClicked}
            thumbsDownClicked={this.state.thumbsDownClicked}
          />
          {/*Announcements from homepage */}
          {homePage && (announTitle || announBody) && messages.length == 0 && (
            <Message info style={announcementStyle} className='slide-down'>
              <Message.Header>
                <span dangerouslySetInnerHTML={{ __html: marked.parse(announTitle), }} />
              </Message.Header>
              <Message.Content>
                <span dangerouslySetInnerHTML={{ __html: marked.parse(announBody) }} />
              </Message.Content>
            </Message>
          )}
          {homePage && (
            <div>
              {ENABLE_BILLING && (
                <div className='desktop-only'>
                  <Segment style={{ margin: '1em 0 0 1em', textAlign: 'right', float: 'right', width: '20em' }}>
                    <Progress value={100} total={100} color='blue' progress='ratio' />
                  </Segment>
                </div>
              )}
              <div>
                <Feed.Extra text style={{ display: "flex" }}>
                  {/* <Image src="/images/jeeves-brand.png" size="small" floated="left" /> */}
                  {/* <div style={{ paddingTop: "2em" }}> */}
                  <div>
                    <p style={{ fontSize: '1.5em', fontFamily: 'AvGardd' }}><span style={{ fontSize: '1.5em' }}>Hello!</span><br />I'm <strong>{BRAND_NAME}</strong>, your legal research companion.</p>
                  </div>
                </Feed.Extra>
                <Header style={{ marginTop: "0em", paddingBottom: "1em" }}>
                  How can I help you today?
                </Header>
              </div>
            </div>
          )}
          {caseID && (
            <Feed.Extra text style={{ paddingBottom: "1.5rem", marginTop: '0.5rem' }}>
              <Header>Can I help you with this case?</Header>
            </Feed.Extra>
          )}
          {(conversationID && !actualConversation) && (
            <div className='conversation-title-container' >
              <Header as="h2" style={{ marginBottom: '0.3em' }}>Conversation #{conversationID}</Header>
            </div>
          )}
          {(conversationID && actualConversation) && (
            <div className='conversation-title-container' >
              {/* <Header as="h2">{actualConversation.title}</Header> */}
              {this.conversationTitle(this.state.editedTitle ? this.state.editedTitle : actualConversation.title)}
              {actualConversation.matter_id && (
                <Header as="h3" style={{ marginTop: '0' }}><Link to={"/matters/" + actualConversation.matter_id}><Icon name='left chevron' /> Back to Matter</Link></Header>
              )}
            </div>
          )}
          {/* style={{ paddingBottom: "1.5rem", marginTop: '0.5rem' }}  */}
          {matterID && (
            <div className='conversation-title-container'>
              <Header as="h2" style={{ marginBottom: '0.3em' }}>{matterTitle}</Header>
              <Header as="h3" style={{ marginTop: '0' }}><Link to={"/matters/" + matterID} onClick={this.props.fetchConversations}><Icon name='left chevron' /> Back to Matter</Link></Header>
            </div>
          )}
          {/* The chat messages start rendering here */}
          {this.props.includeFeed &&
            messages &&
            messages.length > 0 &&
            this.state.groupedMessages.map((group, groupIndex) => {
              let message;
              //here it checks if the group message rendering is from assistant and if it has more than 1 message (because regenerated answers)
              if (group.messages[0].role === "assistant" && group.messages.length > 1) {
                //this is the active answer the user selected to read
                message = group.messages[group.activeMessageIndex];
              } else {
                message = group.messages[0];
              }
              return (
                <Feed.Event key={message.id} data-message-id={message.id}>
                  <Feed.Content>
                    {/* Actual content of message */}
                    <Feed.Summary className='info-assistant-header'>
                      <Feed.User>
                        <a href={'/users/' + message.author}>{message.author || message.user_id}</a>{" "}
                      </Feed.User>
                      <Feed.Date as='abbr' title={message.updated_at} class='relative'>{toRelativeTime(message.updated_at)}</Feed.Date>
                      {message.role === "assistant" && (
                        <div className="controls info-icon">
                          <Button.Group basic size='mini'>
                            <Popup
                              content="More information"
                              trigger={
                                <Button icon onClick={() => this.messageInfo(message.id)}>
                                  <Icon
                                    name="info"
                                    color="blue"
                                    style={{ cursor: "pointer", marginLeft: "0.5rem" }}
                                  />
                                </Button>
                              }
                            />
                            {/* the regenerate answer button only shows in the last answer */}
                            {group === this.state.groupedMessages[this.state.groupedMessages.length - 1] &&
                              message.role === "assistant" && !reGeneratingReponse && !generatingReponse && (
                                <Popup
                                  content="Regenerate this answer"
                                  trigger={
                                    <Button icon onClick={this.regenerateAnswer}>
                                      <Icon
                                        name="redo"
                                        color="grey"
                                        style={{ cursor: "pointer", marginLeft: "1rem" }}
                                      />
                                    </Button>
                                  }
                                />
                              )}
                            {message.role === "assistant" && (
                              <Popup
                                content="Copied to clipboard"
                                on="click"
                                open={this.state.copiedStatus[message.id] || false}
                                trigger={
                                  <Popup content='Copy to clipboard' trigger={
                                    <Button
                                      onClick={() =>
                                        this.copyToClipboard(
                                          message.id,
                                          marked.parse(message.content)
                                        )
                                      }
                                      icon>
                                      <Icon name="clipboard outline" />
                                    </Button>
                                  } />
                                }
                              />
                            )}
                            <Popup
                              content="Rate this message"
                              trigger={
                                <Button icon onClick={() => this.thumbsDown(message.id)}>
                                  <Icon
                                    name="thumbs down outline"
                                    color="grey"
                                    style={{ cursor: "pointer", marginLeft: "1rem" }}
                                  />
                                </Button>
                              }
                            />
                            <Popup
                              content="Rate this message"
                              trigger={
                                <Button icon onClick={() => this.thumbsUp(message.id)}>
                                  <Icon
                                    name="thumbs up outline"
                                    color="grey"
                                    style={{ cursor: "pointer", marginLeft: "0.1rem" }}
                                  />
                                </Button>
                              }
                            />
                          </Button.Group>
                        </div>
                      )}
                    </Feed.Summary>
                    <Feed.Extra text>
                      {message.status !== "computing" && (
                        <span dangerouslySetInnerHTML={{ __html: marked.parse(message.content || ""), }} />
                      )}
                    </Feed.Extra>
                    <Feed.Extra text>
                      {generatingReponse &&
                        message.id === messages[messages.length - 1].id &&
                        !reGeneratingReponse && (
                          <Header size="small" style={{ fontSize: "1em", marginTop: "1.5em" }}>
                            <Icon name="spinner" loading />
                            {BRAND_NAME} is generating a response...
                          </Header>
                        )}
                      {reGeneratingReponse &&
                        group ===
                        this.state.groupedMessages[this.state.groupedMessages.length - 1] && (
                          <Header
                            size="small"
                            style={{ fontSize: "1em", marginTop: "1.5em" }}
                          >
                            <Icon name="spinner" loading /> Novo is trying again...
                          </Header>
                        )}
                      <div className="answer-controls" text>
                        {/* Answers Navigation Controls */}
                        {group.messages.length > 1 && (
                          <div className="answer-navigation">
                            <Button
                              icon="angle left"
                              size="tiny"
                              style={controlsStyle}
                              basic
                              onClick={() =>
                                this.navigateMessage(groupIndex, -1)
                              }
                              disabled={group.activeMessageIndex === 0}
                            />
                            <span
                              style={{ fontWeight: "bold", color: "grey" }}
                            >{`${group.activeMessageIndex + 1} / ${group.messages.length
                              }`}</span>
                            <Button
                              icon="angle right"
                              size="tiny"
                              style={controlsStyle}
                              basic
                              onClick={() =>
                                this.navigateMessage(groupIndex, 1)
                              }
                              disabled={
                                group.activeMessageIndex ===
                                group.messages.length - 1
                              }
                            />
                          </div>
                        )}
                      </div>
                    </Feed.Extra>
                  </Feed.Content>
                </Feed.Event>
              );
            })}
        </Feed>
        <Form
          size="big"
          onSubmit={this.handleSubmit.bind(this)}
          loading={loading}
          style={{ width: "99%" }} >
          <Form.Input>
            <TextareaAutosize
              id="primary-query"
              className="prompt-bar"
              name="query"
              required
              placeholder={placeholder}
              onChange={(e) => this.setState({ query: e.target.value })}
              disabled={isSending}
              loading={isSending}
              value={query}
              maxRows={5}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  this.handleSubmit(e);
                }
              }}
              onFocus={this.handleTextareaFocus}
              onBlur={this.handleTextareaBlur}
              style={{ resize: "none", zIndex: '1' }}
            />
            <Icon
              name="microphone icon"
              color="grey"
              className='microphone icon'
              onClick={() => this.handleMicrophoneClick(this)}
              //this inline style is necessary to make the icon look lighter when the textarea is not focused
              style={{ color: this.state.isTextareaFocused ? 'grey' : 'lightgrey' }}
            />
          </Form.Input>
        </Form>
        {messages.length === 0 && homePage && (
          <section className='desktop-only'>
            <Container>
              <Header as="h4" style={{ marginTop: '2em', marginBottom: '2em' }}>
                You can try...
              </Header>
              <Grid columns='equal' className="home-dropdowns" onBlur={() => this.setState({ query: "" })}>
                <GridColumn>
                  <Dropdown
                    size="big"
                    placeholder="Find a case that..."
                    selection
                    text="Find a case that..."
                    options={caseDropOptions}
                    onChange={this.handleChangeDropdown}
                  />
                </GridColumn>
                <GridColumn>
                  <Dropdown
                    size="big"
                    placeholder="Draft a brief..."
                    selection
                    text="Draft a brief..."
                    options={draftDropOptions}
                    onChange={this.handleChangeDropdown}
                  />
                </GridColumn>
                <GridColumn>
                  <Dropdown
                    size="big"
                    placeholder="Outline a motion..."
                    selection
                    text="Outline a motion..."
                    options={outlineDropOptions}
                    onChange={this.handleChangeDropdown}
                  />
                </GridColumn>
              </Grid>
            </Container>
          </section>
        )}
      </section>
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
