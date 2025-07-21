'use strict';

const {
  BRAND_NAME,
  ALLOWED_UPLOAD_TYPES,
  ENABLE_BILLING
} = require('../constants');

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');
const hark = require('hark');
const { Link, Navigate, useParams } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Card,
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

// Functions
const toRelativeTime = require('../functions/toRelativeTime');

// Components
const { caseDropOptions, draftDropOptions, outlineDropOptions } = require('./SuggestionOptions');
// const InformationSidebar = require('./InformationSidebar');
// const Typewriter = require('./Typewriter');

class ChatBox extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      takeFocus: false
    }, props);

    // Global state is now managed by Bridge component
    this.globalState = this.props.bridge ? this.props.bridge.getGlobalState() : {};

    // Track if bridge message handler is set up
    this.bridgeMessageHandlerSet = false;

    this.state = {
      query: '',
      generatingResponse: false,
      reGeneratingResponse: false,
      groupedMessages: (props.chat?.messages.length > 0) ? this.groupMessages(props.chat.messages) : [],
      currentDisplayedMessage: {}, // state to store the answer that has to be showed (in case of regenerated answers)
      previousFlag: false,
      connectionProblem: false,
      copiedStatus: {},
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      checkingMessageID: 0,//id from the message rating
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      isTextareaFocused: false, //this is needed to work on the microphone icon color
      editedTitle: '',
      editLoading: false,
      editingTitle: false,
      startedChatting: false,
      takeFocus: this.settings.takeFocus || this.props.takeFocus || false,
      // New states for file preview
      filePreview: null,
      showFilePreview: false,
      attachmentExists: false,
      uploadProgress: 0,
      isUploading: false,
      uploadedFileId: null,
      loading: false, // Added loading state
      signingKey: null, // Add signing key to state
      isRecording: false,
      fileMetadataCache: {}, // file ID -> metadata
      unsupportedVideoWarning: false,
      // Streaming states
      streamingMessageId: null,
      streamingContent: '',
      isStreaming: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChangeDropdown = this.handleChangeDropdown.bind(this);

    // Add styles for file preview animation
    this.filePreviewStyles = {
      container: {
        overflow: 'visible',
        transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
        maxHeight: 'none',
        opacity: '0',
        marginBottom: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        padding: '0 10px'
      },
      visible: {
        maxHeight: 'none',
        opacity: '1',
        padding: '10px'
      },
      content: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      },
      fileName: {
        flex: 1,
        overflow: 'visible',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      },
      removeButton: {
        cursor: 'pointer',
        color: '#666',
        marginTop: '2px'
      }
    };
  }

  componentDidMount () {
    if (this.props.takeFocus) $('#primary-query').focus();

    //this.props.resetChat();
    // No longer using polling - WebSocket handles real-time updates

    // Set up Bridge message handler for JSON-PATCH updates
    if (this.props.bridge) {
      this.setupBridgeMessageHandler();
    }

    // Subscribe to current conversation and messages
    if (this.props.conversationID && this.props.bridge) {
      this.subscribeToConversation(this.props.conversationID);
    }

    window.addEventListener('resize', this.handleResize);

    // Listen for global state updates from Bridge
    this.globalStateUpdateHandler = this.handleGlobalStateUpdate.bind(this);
    window.addEventListener('globalStateUpdate', this.globalStateUpdateHandler);

    // Disable timer to prevent infinite re-render loops
    // Streaming updates are now handled through global state update events
    // this.streamingCheckInterval = setInterval(() => {
    //   // Timer code removed to prevent infinite loops
    // }, 500);
  }

  componentDidUpdate (prevProps, prevState) {
    const { messages } = this.props.chat;
    //here we store the last message from prevProps and current messages
    const prevLastMessage = prevProps.chat.messages[prevProps.chat.messages.length - 1];
    const currentLastMessage = messages[messages.length - 1];
    if (this.props.conversationID)
      if (this.props.conversationID !== prevProps.conversationID) {
        // Unsubscribe from old conversation and subscribe to new one
        if (prevProps.conversationID && this.props.bridge) {
          this.unsubscribeFromConversation(prevProps.conversationID);
        }
        if (this.props.conversationID && this.props.bridge) {
          this.subscribeToConversation(this.props.conversationID);
        }

        // Clear streaming state when conversation changes
        this.setState({
          streamingMessageId: null,
          streamingContent: '',
          isStreaming: false,
          generatingResponse: false
        });
      }

    // Subscribe to all messages in the conversation for real-time updates
    if (messages && messages.length > 0 && this.props.bridge) {
      messages.forEach(message => {
        if (message.id) {
          this.subscribeToMessage(message.id);
        }
      });
    }

    // Check for new messages and subscribe to them
    if (prevProps.chat.messages.length !== messages.length && this.props.bridge) {
      const newMessages = messages.slice(prevProps.chat.messages.length);
      newMessages.forEach(message => {
        if (message.id) {
          console.debug('[CHATBOX]', 'Subscribing to new message:', message.id);
          this.subscribeToMessage(message.id);
        }
      });
    }

    // Subscribe to conversation updates
    if (this.props.conversationID && this.props.bridge) {
      this.subscribeToConversation(this.props.conversationID);
    }

    // we go this way if we have more messages than before or if the content of the last message
    // changed, this happens when the last message from assistant changes from "Agent is researching..." to the actual answer
    if ((prevProps.chat.messages.length !== messages.length) ||
      //if the previous last message is different than the current last message, we call the groupMessages function again
      (prevLastMessage && currentLastMessage && prevLastMessage.content !== currentLastMessage.content)) {
      const newGroupedMessages = this.groupMessages(this.props.chat.messages);
      this.setState({ groupedMessages: newGroupedMessages });
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role && lastMessage.role === 'assistant' && lastMessage.status !== 'computing') {
          this.setState({ generatingResponse: false });
          this.setState({ reGeneratingResponse: false });
          this.props.getMessageInformation(lastMessage.content);
        } else if (lastMessage && lastMessage.role && lastMessage.role === 'assistant' && lastMessage.status === 'computing') {
          // Keep generatingResponse true when message is in computing status (placeholder state)
          console.debug('[CHATBOX]', 'componentDidUpdate: Keeping generatingResponse true for computing message:', lastMessage.id);
          this.setState({ generatingResponse: true });
        } else {
          //this is to add generating reponse after an user submitted message but not when you are in a historic conversation with last message from user
          this.setState({ generatingResponse: true });
          // if (!this.props.previousChat || (this.state.previousFlag && this.props.previousChat)) {
          //   this.setState({ generatingResponse: true });
          // }
        }
      }
      this.scrollToBottom();
    }
  }

  componentWillUnmount () {
    // Clear the streaming check interval (if it exists)
    if (this.streamingCheckInterval) {
      clearInterval(this.streamingCheckInterval);
    }

    // Remove global state update listener
    if (this.globalStateUpdateHandler) {
      window.removeEventListener('globalStateUpdate', this.globalStateUpdateHandler);
    }

    this.setState({
      chat: {
        message: null,
        messages: []
      },
      conversations: [],
      message: null,
      messages: [],
    });

    // Unsubscribe from message paths
    if (this.props.bridge && this.subscribedMessagePaths) {
      this.subscribedMessagePaths.forEach(path => {
        this.props.bridge.unsubscribe(path);
      });
    }

    window.removeEventListener('resize', this.handleResize);
  }

  // Set up Bridge message handler for JSON-PATCH updates
  setupBridgeMessageHandler = () => {
    if (!this.props.bridge) return;

    if (this.bridgeMessageHandlerSet) {
      console.debug('[CHATBOX]', 'Bridge message handler already set up');
      return;
    }

    // Check if bridge has props and responseCapture (for test compatibility)
    if (!this.props.bridge.props || typeof this.props.bridge.props.responseCapture !== 'function') {
      console.debug('[CHATBOX]', 'Bridge does not have responseCapture method, skipping message handler setup');
      return;
    }

    // Store subscribed message paths
    this.subscribedMessagePaths = new Set();

    // Set up message handler
    const originalHandler = this.props.bridge.props.responseCapture;
    this.props.bridge.props.responseCapture = (msg) => {
      this.handleBridgeMessage(msg);
      if (originalHandler) originalHandler(msg);
    };

    this.bridgeMessageHandlerSet = true;
    console.debug('[CHATBOX]', 'Bridge message handler set up successfully');
  };

  // Handle Bridge messages (JSON-PATCH updates)
  handleBridgeMessage = async (msg) => {
    if (!msg) return;

    console.debug('[CHATBOX]', 'Received Bridge message:', {
      type: msg.type,
      hasPath: !!msg.path,
      hasValue: !!msg.value,
      path: msg.path,
      valueKeys: msg.value ? Object.keys(msg.value) : null,
      streamingMessageId: this.state.streamingMessageId,
      fullMessage: msg
    });

    // Handle JSON-PATCH messages for conversation updates
    if (msg.type === 'PATCH') {
      console.debug('[CHATBOX]', 'Processing PATCH message:', msg);

      // Extract path and value from the message
      const path = msg.path;
      const value = msg.value;

      console.debug('[CHATBOX]', 'Extracted PATCH data:', { path, value });

      // Handle conversation updates
      if (path && path.startsWith('/conversations/')) {
        console.debug('[CHATBOX]', 'Received conversation PATCH:', path, value);
        // Refresh conversation data
        if (this.props.conversationID) {
          this.props.getMessages({ conversation_id: this.props.conversationID });
        }
      }

      // Handle message updates
      if (path && path.startsWith('/messages/')) {
        console.debug('[CHATBOX]', 'Received message PATCH:', path, value);
        const messageId = path.split('/')[2];
        console.debug('[CHATBOX]', 'Message ID from path:', messageId);
        console.debug('[CHATBOX]', 'Current streaming message ID:', this.state.streamingMessageId);
        console.debug('[CHATBOX]', 'Message IDs match:', messageId === this.state.streamingMessageId);

        // Handle initial computing status (placeholder message)
        if (value && value.status === 'computing') {
          console.debug('[CHATBOX]', 'Message in computing status (placeholder):', {
            messageId: messageId,
            currentStreamingId: this.state.streamingMessageId,
            currentIsStreaming: this.state.isStreaming,
            content: value.content ? value.content.substring(0, 100) + '...' : 'no content'
          });

          // Set generatingResponse to true to show placeholder
          if (!this.state.streamingMessageId || this.state.streamingMessageId === messageId) {
            console.debug('[CHATBOX]', 'Setting generatingResponse for computing message:', messageId);

            this.setState({
              streamingMessageId: messageId,
              isStreaming: false,
              streamingContent: '',
              generatingResponse: true  // Show placeholder while computing
            }, () => {
              console.debug('[CHATBOX]', 'State updated for computing - generatingResponse:', this.state.generatingResponse);
              this.forceUpdate();
              // Scroll to bottom when computing status is set
              this.scrollToBottom();
            });
          }
        } else if (value && value.status === 'streaming') {
          console.debug('[CHATBOX]', 'Message transitioned to streaming:', {
            messageId: messageId,
            currentStreamingId: this.state.streamingMessageId,
            currentIsStreaming: this.state.isStreaming,
            content: value.content ? value.content.substring(0, 100) + '...' : 'no content'
          });

          // Set streaming state if we don't have a streaming message ID yet, or if this is the same message
          if (!this.state.streamingMessageId) {
            console.debug('[CHATBOX]', 'Setting initial streaming state for message:', messageId);

            // Create a temporary streaming message to show in the UI
            const streamingMessage = {
              id: messageId,
              fabric_id: messageId,
              content: value.content || '',
              status: 'streaming',
              role: 'assistant',
              author: 'Sensemaker',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            console.debug('[CHATBOX]', 'About to set streaming state:', {
              streamingMessageId: messageId,
              isStreaming: true,
              streamingContent: value.content || '',
              generatingResponse: value.content ? false : true
            });

            // Use setState to properly trigger React updates, then force update for immediate rendering
            this.setState({
              streamingMessageId: messageId,
              isStreaming: true,
              streamingContent: value.content || '',
              generatingResponse: value.content ? false : true  // Keep generatingResponse true if no content yet
            }, () => {
              console.debug('[CHATBOX]', 'State updated - streamingMessageId:', this.state.streamingMessageId, 'isStreaming:', this.state.isStreaming);
              // Force additional re-render to ensure streaming content is displayed
              this.forceUpdate();
              // Scroll to bottom when streaming starts
              this.scrollToBottom();
            });
          } else if (this.state.streamingMessageId === messageId) {
            console.debug('[CHATBOX]', 'Updating streaming state for existing message:', messageId);

            // Use setState to properly trigger React updates, then force update for immediate rendering
            this.setState({
              streamingContent: value.content || '',
              isStreaming: true,
              generatingResponse: false  // Stop showing "generating response" once we have content
            }, () => {
              console.debug('[CHATBOX]', 'Streaming content updated:', this.state.streamingContent?.substring(0, 50) + '...');
              // Force additional re-render to ensure streaming content is displayed
              this.forceUpdate();
              // Scroll to bottom when streaming content updates
              this.scrollToBottom();
            });
          }

          // Fallback: If state still isn't set after a short delay, force it
          setTimeout(() => {
            if (!this.state.streamingMessageId && value && value.status === 'streaming') {
              console.debug('[CHATBOX]', 'Fallback: Forcing streaming state for message:', messageId);

              // Use setState to properly trigger React updates, then force update for immediate rendering
              this.setState({
                streamingMessageId: messageId,
                isStreaming: true,
                streamingContent: value.content || '',
                generatingResponse: value.content ? false : true
              }, () => {
                console.debug('[CHATBOX]', 'Fallback state updated - streamingMessageId:', this.state.streamingMessageId);
                // Force additional re-render to ensure streaming content is displayed
                this.forceUpdate();
                // Scroll to bottom when fallback streaming state is set
                this.scrollToBottom();
              });
            }
          }, 100);
        }

        // Note: Streaming content updates are now handled in the streaming status check above

        // If message is complete, refresh messages and stop streaming
        if (value && value.status === 'ready') {
          console.debug('[CHATBOX]', 'Message completed:', messageId);

          // Check if we have the complete content in the value
          if (value.content && value.content.length > 25) {
            console.debug('[CHATBOX]', 'Message ready with complete content:', {
              messageId: messageId,
              contentLength: value.content.length,
              contentPreview: value.content.substring(0, 50) + '...'
            });

            // Update the global state with the complete content immediately
            if (this.globalState && this.globalState.messages) {
              this.globalState.messages[messageId] = {
                ...this.globalState.messages[messageId],
                content: value.content,
                status: 'ready',
                updated_at: value.updated_at
              };
              console.debug('[CHATBOX]', 'Updated global state with complete content');
            }

            // Keep streaming content until the message refresh completes
            // Don't clear streaming state immediately
          } else {
            console.debug('[CHATBOX]', 'Message ready but content seems incomplete:', {
              messageId: messageId,
              contentLength: value.content?.length || 0,
              contentPreview: value.content?.substring(0, 50) + '...'
            });
          }

          // Refresh messages to get final content for any completed message
          if (this.props.conversationID) {
            console.debug('[CHATBOX]', 'Refreshing messages for completed message:', messageId);
            try {
              await this.props.getMessages({ conversation_id: this.props.conversationID });
              console.debug('[CHATBOX]', 'Successfully refreshed messages for completed message:', messageId);

              // After refreshing, clear streaming state if this was the streaming message
              if (this.state.streamingMessageId === messageId) {
                console.debug('[CHATBOX]', 'Clearing streaming state after message refresh');
                // Add a small delay to ensure the message refresh has time to update the UI
                setTimeout(() => {
                  this.setState({
                    isStreaming: false,
                    streamingMessageId: null,
                    streamingContent: '',
                    generatingResponse: false
                  }, () => {
                    // Scroll to bottom when streaming completes
                    this.scrollToBottom();
                  });
                }, 200); // Increased delay to ensure content is preserved
              }
            } catch (error) {
              console.error('[CHATBOX]', 'Failed to refresh messages for completed message:', messageId, error);
            }
          }
        }
      }
    }
  };

  // Subscribe to a specific message path
  subscribeToMessage = (messageId) => {
    if (!this.props.bridge || !messageId) {
      console.debug('[CHATBOX]', 'Cannot subscribe to message:', {
        hasBridge: !!this.props.bridge,
        messageId: messageId
      });
      return;
    }

    // Check if bridge has subscribe method (for test compatibility)
    if (typeof this.props.bridge.subscribe !== 'function') {
      console.debug('[CHATBOX]', 'Bridge does not have subscribe method, skipping subscription');
      return;
    }

    // Initialize subscribedMessagePaths if not already done
    if (!this.subscribedMessagePaths) {
      this.subscribedMessagePaths = new Set();
    }

    const path = `/messages/${messageId}`;
    if (!this.subscribedMessagePaths.has(path)) {
      console.debug('[CHATBOX]', 'Subscribing to message path:', path);
      this.props.bridge.subscribe(path);
      this.subscribedMessagePaths.add(path);
      console.debug('[CHATBOX]', 'Successfully subscribed to message path:', path);
    } else {
      console.debug('[CHATBOX]', 'Already subscribed to message path:', path);
    }
  };

  // Unsubscribe from a specific message path
  unsubscribeFromMessage = (messageId) => {
    if (!this.props.bridge || !messageId) return;

    // Check if bridge has unsubscribe method (for test compatibility)
    if (typeof this.props.bridge.unsubscribe !== 'function') {
      console.debug('[CHATBOX]', 'Bridge does not have unsubscribe method, skipping unsubscription');
      return;
    }

    // Initialize subscribedMessagePaths if not already done
    if (!this.subscribedMessagePaths) {
      this.subscribedMessagePaths = new Set();
    }

    const path = `/messages/${messageId}`;
    if (this.subscribedMessagePaths.has(path)) {
      this.props.bridge.unsubscribe(path);
      this.subscribedMessagePaths.delete(path);
      console.debug('[CHATBOX]', 'Unsubscribed from message path:', path);
    }
  };

  // Subscribe to conversation updates
  subscribeToConversation = (conversationId) => {
    if (!this.props.bridge || !conversationId) return;

    // Check if bridge has subscribe method (for test compatibility)
    if (typeof this.props.bridge.subscribe !== 'function') {
      console.debug('[CHATBOX]', 'Bridge does not have subscribe method, skipping conversation subscription');
      return;
    }

    // Initialize subscribedMessagePaths if not already done
    if (!this.subscribedMessagePaths) {
      this.subscribedMessagePaths = new Set();
    }

    const path = `/conversations/${conversationId}`;
    if (!this.subscribedMessagePaths.has(path)) {
      console.debug('[CHATBOX]', 'Subscribing to conversation path:', path);
      this.props.bridge.subscribe(path);
      this.subscribedMessagePaths.add(path);
      console.debug('[CHATBOX]', 'Successfully subscribed to conversation path:', path);
    }
  };

  // Setup streaming listener for a specific message (for testing compatibility)
  setupStreamingListener = (messageId) => {
    if (!this.props.bridge || !messageId) {
      console.debug('[CHATBOX]', 'Cannot setup streaming listener:', {
        hasBridge: !!this.props.bridge,
        messageId: messageId
      });
      return;
    }

    console.debug('[CHATBOX]', 'Setting up streaming listener for message:', messageId);

    // Subscribe to the message path
    this.subscribeToMessage(messageId);

    // Set up streaming state
    this.setState({
      streamingMessageId: messageId,
      isStreaming: true,
      streamingContent: ''
    });

    // Set up Bridge message handler if not already done
    if (!this.bridgeMessageHandlerSet) {
      this.setupBridgeMessageHandler();
    }
  };

  // Unsubscribe from conversation updates
  unsubscribeFromConversation = (conversationId) => {
    if (!this.props.bridge || !conversationId) return;

    // Check if bridge has unsubscribe method (for test compatibility)
    if (typeof this.props.bridge.unsubscribe !== 'function') {
      console.debug('[CHATBOX]', 'Bridge does not have unsubscribe method, skipping conversation unsubscription');
      return;
    }

    // Initialize subscribedMessagePaths if not already done
    if (!this.subscribedMessagePaths) {
      this.subscribedMessagePaths = new Set();
    }

    const path = `/conversations/${conversationId}`;
    if (this.subscribedMessagePaths.has(path)) {
      this.props.bridge.unsubscribe(path);
      this.subscribedMessagePaths.delete(path);
      console.debug('[CHATBOX]', 'Unsubscribed from conversation path:', path);
    }
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

  handleChange = (e) => {
    const value = e.target.value;
    if (this.props.onInputChange) {
      // Call the parent's input change handler with a properly structured event
      this.props.onInputChange({
        target: {
          value: value
        }
      });
    }
    this.setState({ query: value });
  };

  handleChangeDropdown = async (e, { name, value }) => {
    if (value != '') {
      this.setState({ query: value });
      const { message } = this.props.chat;
      let dataToSubmit;

      this.setState({ loading: true });

      dataToSubmit = {
        conversation_id: message?.conversation,
        content: value,
      }

      try {
        console.debug('[CHATBOX]', 'Submitting dropdown streaming message:', dataToSubmit);

        const result = await this.props.submitStreamingMessage(dataToSubmit);

        console.debug('[CHATBOX]', 'Dropdown streaming message submitted:', result);

        this.setState({
          streamingMessageId: result.assistant_message_id,
          isStreaming: true,
          streamingContent: '',
          loading: false
        });

        // Subscribe to the message path for real-time updates
        this.subscribeToMessage(result.assistant_message_id);

        // Streaming is handled through Bridge's responseCapture mechanism

      } catch (error) {
        console.error('[CHATBOX]', 'Dropdown streaming message submission failed:', error);

        this.setState({
          loading: false,
          error: 'Failed to send message. Please try again.'
        });

        // Clear error after 5 seconds
        setTimeout(() => {
          this.setState({ error: null });
        }, 5000);
      }

      // Clear the input after sending the message
      this.setState({ query: '' });
    }
  }

  handleClick = (e) => {
    console.debug('clicked reset button', e);
    // this.props.resetChat();
    this.setState({ message: null, chat: { message: null } });
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const { query } = this.state;
    const { message } = this.props.chat;
    const { documentChat, context, agent } = this.props;

    if (!query.trim()) return;

    this.setState({ loading: true, previousFlag: true, startedChatting: true });

    this.props.getMessageInformation(query);

    let dataToSubmit;

    // Prepare data for submission
    if (!this.props.previousChat) {
      // New conversation
      dataToSubmit = {
        conversation_id: message?.conversation,
        content: query,
        context: context,
        agent: agent,
        file_id: this.state.uploadedFileId || null
      }
    } else {
      // Existing conversation
      dataToSubmit = {
        conversation_id: this.props.conversationID,
        content: query,
        context: context,
        agent: agent,
        file_id: this.state.uploadedFileId || null
      }
    }

    try {
      console.debug('[CHATBOX]', 'Submitting streaming message:', {
        dataToSubmit: dataToSubmit,
        query: query,
        queryType: typeof query,
        queryLength: query ? query.length : 0,
        contentValue: dataToSubmit.content,
        contentType: typeof dataToSubmit.content
      });
      const result = await this.props.submitStreamingMessage(dataToSubmit);
      console.debug('[CHATBOX]', 'Streaming message submitted:', result);

      this.setState({
        streamingMessageId: result.assistant_message_id,
        isStreaming: true,
        streamingContent: '',
        loading: false,
        generatingResponse: true  // Show "generating response" message until we get streaming content
      }, () => {
        // Scroll to bottom when new message is submitted
        this.scrollToBottom();
      });

      // Subscribe to the message path for real-time updates
      this.subscribeToMessage(result.assistant_message_id);

      // Streaming is handled through Bridge's responseCapture mechanism

    } catch (error) {
      console.error('[CHATBOX]', 'Streaming message submission failed:', error);

      // Show error to user
      this.setState({
        loading: false,
        error: 'Failed to send message. Please try again.'
      });

      // Clear error after 5 seconds
      setTimeout(() => {
        this.setState({ error: null });
      }, 5000);
    }

    // Clear the input after sending the message
    this.setState({ query: '' });

    // Don't call fetchData here as it resets the streaming state
    // The Bridge will handle real-time updates via JSON-PATCH messages
  }

  regenerateAnswer = (event) => {
    event.preventDefault();

    const { groupedMessages } = this.state;
    const { message } = this.props.chat;
    const { documentChat } = this.props;

    let dataToSubmit;
    this.setState({ reGeneratingResponse: true, loading: true, previousFlag: true, startedChatting: true });

    const messageRegen = groupedMessages[groupedMessages.length - 2].messages[0];

    //scrolls so it shows the regenerating message
    this.scrollToBottom();

    // Prepare data for regeneration
    if (!this.props.previousChat) {
      dataToSubmit = {
        conversation_id: message?.conversation,
        content: messageRegen.content,
        id: messageRegen.id
      }
    } else {
      dataToSubmit = {
        conversation_id: this.props.conversationID,
        content: messageRegen.content,
        id: messageRegen.id
      }
    }

    const fileFabricID = documentChat ? (this.props.documentInfo ? this.props.documentInfo.fabric_id : null) : null;

    // Use streaming for regeneration
    try {
      console.debug('[CHATBOX]', 'Regenerating answer with streaming:', dataToSubmit);

      this.props.regenAnswer(dataToSubmit, null, fileFabricID).then((result) => {
        console.debug('[CHATBOX]', 'Regeneration streaming started:', result);

        this.setState({
          streamingMessageId: result.assistant_message_id,
          isStreaming: true,
          streamingContent: '',
          loading: false
        });

        // Subscribe to the message path for real-time updates
        this.subscribeToMessage(result.assistant_message_id);

        // Streaming is handled through Bridge's responseCapture mechanism
      }).catch((error) => {
        console.error('[CHATBOX]', 'Regeneration streaming failed:', error);
        this.setState({
          loading: false,
          error: 'Failed to regenerate answer. Please try again.'
        });

        // Clear error after 5 seconds
        setTimeout(() => {
          this.setState({ error: null });
        }, 5000);
      });
    } catch (error) {
      console.error('[CHATBOX]', 'Regeneration failed:', error);
      this.setState({
        loading: false,
        error: 'Failed to regenerate answer. Please try again.'
      });

      // Clear error after 5 seconds
      setTimeout(() => {
        this.setState({ error: null });
      }, 5000);
    }

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
          if (!this.state) {
            console.debug('undefined state');
            return;
          }

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
    if (!('webkitSpeechRecognition' in window)) {
      console.debug('Speech recognition not supported');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Add recording state to handle UI updates
    this.setState({ isRecording: !this.state.isRecording });

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const speaker = hark(stream, {
        // Configure silence detection
        threshold: -65,      // silence threshold in dB
        interval: 100,       // interval for silence checks
        timeout: 1000       // time until silence is detected
      });

      let silenceTimeout;
      let finalTranscript = '';

      speaker.on('speaking', () => {
        console.debug('[SENSEMAKER]', 'Speaking detected');
        // Clear any existing silence timeout
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }
      });

      speaker.on('stopped_speaking', () => {
        console.debug('[SENSEMAKER]', 'Silence detected');
        // Set timeout to stop recognition after sustained silence
        silenceTimeout = setTimeout(() => {
          recognition.stop();
          stream.getTracks().forEach(track => track.stop());
          speaker.stop();

          // Update UI and input field with final transcript
          this.setState({
            isRecording: false,
            query: finalTranscript
          });
        }, 2000); // Wait 2 seconds of silence before stopping
      });

      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript = transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update the input field with current transcript
        this.setState({
          query: finalTranscript || interimTranscript
        });
      };

      recognition.start();
    }).catch((err) => {
      console.error('Media stream error:', err);
      this.setState({ isRecording: false });
    });
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
    } else {
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

  handleAttachmentIntent = (value) => {
    console.debug('attaching file:', value);
    this.setState({ attachingFile: true, loading: true });
    const fileInput = document.querySelector('#input-control-form input[type="file"]');
    if (fileInput) {
      fileInput.click();
      // Add a timeout to clear loading if no file is selected after 1 second
      setTimeout(() => {
        if (!fileInput.files || fileInput.files.length === 0) {
          this.setState({ loading: false });
        }
      }, 1000);
    }
  };

  handleEditClick = (currentTitle) => {
    this.setState({ editingTitle: true, editedTitle: currentTitle });
  };

  handleFileChange = async (e) => {
    console.debug('handling file change:', e.target.files);
    const files = e.target.files;
    this.setState({ formatError: false, unsupportedVideoWarning: false });

    // If no files were selected (canceled), clear loading state and return
    if (!files || files.length === 0) {
      this.setState({ loading: false });
      return;
    }

    const file = files[0]; // Take only the first file
    if (this.isValidFileType(file.type)) {
      console.debug('File selected:', file.name, file.size, file.type);

      // Check if it's an unsupported video format
      const isUnsupportedVideo = this.isUnsupportedVideoFormat(file.type);

      this.setState({
        file: file,
        formatError: false,
        attachmentExists: true,
        filePreview: {
          name: file.name,
          size: this.formatFileSize(file.size),
          type: file.type
        },
        showFilePreview: true,
        isUploading: true,
        uploadProgress: 0,
        loading: true, // Set loading state when starting upload
        unsupportedVideoWarning: isUnsupportedVideo
      });

      // Start upload immediately after file selection
      try {
        const result = await this.props.uploadFile(file);

        // Validate the upload response
        if (!result) {
          throw new Error('Upload failed - no response received');
        }

        // Check various possible response structures for the file ID
        const fileId = result.id ||
                      (result.response && result.response.id) ||
                      (result.data && result.data.id) ||
                      result.id;

        if (!fileId) {
          console.error('Upload response:', result);
          throw new Error('Upload failed - no file ID received in response');
        }

        this.setState({
          uploadProgress: 100,
          isUploading: false,
          uploadedFileId: fileId,
          loading: false // Reset loading state after successful upload
        });
      } catch (error) {
        console.error('Upload error:', error);
        this.setState({
          isUploading: false,
          formatError: true,
          errorMsg: error.message || 'Failed to upload file',
          loading: false, // Reset loading state on error
          unsupportedVideoWarning: false
        });
      }
    } else {
      this.setState({
        formatError: true,
        file: null,
        loading: false, // Reset loading state for invalid file type
        unsupportedVideoWarning: false
      });
    }
  };

  removeFile = () => {
    this.setState({
      file: null,
      filePreview: null,
      showFilePreview: false,
      attachmentExists: false,
      uploadProgress: 0,
      isUploading: false,
      uploadedFileId: null,
      loading: false,
      unsupportedVideoWarning: false
    });
    // Reset the file input
    const fileInput = document.querySelector('#input-control-form input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  isValidFileType (fileType) {
    return ALLOWED_UPLOAD_TYPES.includes(fileType);
  }

  isUnsupportedVideoFormat (fileType) {
    const unsupportedVideoFormats = [
      'video/x-ms-wmv',
      'video/wmv',
      'video/x-msvideo', // Some AVI variants
      'video/flv'        // Flash video
    ];
    return unsupportedVideoFormats.includes(fileType);
  }

  // Fetch file metadata and cache it
  fetchFileMetadata = async (fileId) => {
    if (!fileId) return;
    if (this.state.fileMetadataCache[fileId]) return; // already cached
    try {
      const response = await fetch(`/files/${fileId}`);
      if (response.ok) {
        const data = await response.json();
        this.setState((prevState) => ({
          fileMetadataCache: {
            ...prevState.fileMetadataCache,
            [fileId]: data,
          },
        }));
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  // Get current global state from Bridge
  getGlobalState = () => {
    return this.props.bridge ? this.props.bridge.getGlobalState() : {};
  };

  // Handle global state updates from Bridge
  handleGlobalStateUpdate = (event) => {
    const { operation, globalState } = event.detail;

    console.debug('[CHATBOX]', 'Received global state update:', {
      operation,
      globalStateKeys: Object.keys(globalState),
      messagesCount: Object.keys(globalState.messages || {}).length,
      streamingMessages: Object.entries(globalState.messages || {}).filter(([id, msg]) => msg.status === 'streaming').length,
      operationPath: operation?.path,
      operationOp: operation?.op,
      operationValue: operation?.value ? {
        status: operation.value.status,
        hasContent: !!operation.value.content,
        contentLength: operation.value.content?.length || 0
      } : null
    });

    // Preserve streaming content before updating global state
    const currentStreamingContent = this.state.streamingContent;
    const currentStreamingMessageId = this.state.streamingMessageId;

    // Update local reference to global state
    this.globalState = globalState;

    // If we have streaming content but it's not in the new global state, preserve it
    if (currentStreamingContent && currentStreamingMessageId &&
        (!globalState.messages || !globalState.messages[currentStreamingMessageId])) {
      console.debug('[CHATBOX]', 'Preserving streaming content during global state update:', {
        messageId: currentStreamingMessageId,
        contentLength: currentStreamingContent.length
      });

      // Ensure the streaming message exists in global state
      if (!this.globalState.messages) {
        this.globalState.messages = {};
      }
      this.globalState.messages[currentStreamingMessageId] = {
        content: currentStreamingContent,
        status: 'streaming',
        updated_at: new Date().toISOString()
      };
    }

    // Sync global state streaming messages to component state
    this.syncGlobalStateToComponentState();

    // Don't force update here - React will handle re-renders automatically
    // this.forceUpdate();
  };

  syncGlobalStateToComponentState = () => {
    try {
      // Use the local globalState reference that was updated in handleGlobalStateUpdate
      const globalState = this.globalState || {};

      console.debug('[CHATBOX]', 'syncGlobalStateToComponentState called:', {
        globalStateMessages: Object.keys(globalState.messages || {}),
        globalStateMessageDetails: Object.entries(globalState.messages || {}).map(([id, msg]) => ({
          id,
          status: msg.status,
          hasContent: !!msg.content,
          contentLength: msg.content?.length || 0
        }))
      });

      // Check if there are any streaming messages in global state
      if (globalState.messages) {
        const streamingMessages = Object.entries(globalState.messages)
          .filter(([id, message]) => message.status === 'streaming' && message.content)
          .sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

        console.debug('[CHATBOX]', 'Filtered streaming messages:', streamingMessages.map(([id, msg]) => ({
          id,
          status: msg.status,
          hasContent: !!msg.content,
          contentLength: msg.content?.length || 0
        })));

        // Also log all messages for debugging
        console.debug('[CHATBOX]', 'All messages in global state:', Object.entries(globalState.messages || {}).map(([id, msg]) => ({
          id,
          status: msg.status,
          hasContent: !!msg.content,
          contentLength: msg.content?.length || 0
        })));

        if (streamingMessages.length > 0) {
          const [latestStreamingId, latestStreamingMessage] = streamingMessages[0];

          console.debug('[CHATBOX]', 'Syncing streaming message to component state:', {
            messageId: latestStreamingId,
            content: latestStreamingMessage.content?.substring(0, 50) + '...',
            status: latestStreamingMessage.status
          });

          this.setState({
            streamingMessageId: latestStreamingId,
            streamingContent: latestStreamingMessage.content,
            isStreaming: true,  // Set to true since we have a streaming message
            generatingResponse: false  // Stop showing placeholder when streaming starts
          }, () => {
            console.debug('[CHATBOX]', 'State updated for streaming message:', {
              streamingMessageId: this.state.streamingMessageId,
              streamingContent: this.state.streamingContent?.substring(0, 50) + '...',
              isStreaming: this.state.isStreaming,
              generatingResponse: this.state.generatingResponse
            });

            // Scroll to bottom when streaming content updates
            this.scrollToBottom();
          });
        } else {
          // Check for computing messages (placeholder state)
          const computingMessages = Object.entries(globalState.messages)
            .filter(([id, message]) => message.status === 'computing')
            .sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

          if (computingMessages.length > 0) {
            const [latestComputingId, latestComputingMessage] = computingMessages[0];

            console.debug('[CHATBOX]', 'Syncing computing message to component state:', {
              messageId: latestComputingId,
              content: latestComputingMessage.content,
              status: latestComputingMessage.status
            });

            this.setState({
              streamingMessageId: latestComputingId,
              streamingContent: latestComputingMessage.content || '',
              isStreaming: false,
              generatingResponse: true  // Show placeholder while computing
            });
          } else {
            // Check if our current streaming message is now ready in global state
            if (this.state.streamingMessageId && globalState.messages?.[this.state.streamingMessageId]) {
              const currentMessage = globalState.messages[this.state.streamingMessageId];
              if (currentMessage.status === 'ready' && currentMessage.content) {
                console.debug('[CHATBOX]', 'Current streaming message is now ready in global state:', {
                  messageId: this.state.streamingMessageId,
                  contentLength: currentMessage.content.length,
                  status: currentMessage.status
                });

                // Keep the streaming content until the message refresh completes
                // Don't clear streaming state here - let the message completion handler do it
                return;
              }
            }

            // No streaming, computing, or ready messages that match our streaming ID
            // Only clear streaming state if we're not currently streaming a specific message
            // AND we have no streaming content to preserve
            if ((this.state.isStreaming || this.state.generatingResponse) &&
                !this.state.streamingMessageId &&
                !this.state.streamingContent) {
              console.debug('[CHATBOX]', 'No streaming or computing messages found, stopping streaming state');
              this.setState({
                streamingMessageId: null,
                streamingContent: '',
                isStreaming: false,
                generatingResponse: false
              });
            } else if (this.state.streamingMessageId && this.state.streamingContent) {
              // We have streaming content but no matching message in global state
              // This could be a timing issue - preserve the content for now
              console.debug('[CHATBOX]', 'Preserving streaming content despite no matching global state message:', {
                streamingMessageId: this.state.streamingMessageId,
                streamingContentLength: this.state.streamingContent.length
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[CHATBOX]', 'Error syncing global state to component state:', error);
    }
  };

  renderContextCard = () => {
    const { context } = this.props;
    if (!context || typeof context !== 'object' || Object.keys(context).length === 0) {
      return null;
    }

    let cardContent = [];

    // Handle document context
    if (context.document) {
      const doc = context.document;
      cardContent.push(
        <Card.Description key="document-desc">
          <Icon name="file alternate" />
          <strong>Context</strong>
          <div style={{ marginTop: '0.5em' }}>
            <strong>Document:</strong> {doc.title || doc.filename}
            {doc.fabric_type && <div><strong>Type:</strong> {doc.fabric_type}</div>}
            {doc.summary && <div style={{ marginTop: '0.5em' }}>{doc.summary.substring(0, 150)}{doc.summary.length > 150 ? '...' : ''}</div>}
          </div>
        </Card.Description>
      );
    }

    // Handle documents (plural) context
    if (context.documents && Array.isArray(context.documents) && context.documents.length > 0) {
      cardContent.push(
        <Card.Description key="documents-desc">
          <Icon name="folder open" />
          <strong>Context</strong>
          <div style={{ marginTop: '0.5em' }}>
            <strong>Documents:</strong> {context.documents.length} selected
            <div style={{ marginTop: '0.5em' }}>
              {context.documents.slice(0, 3).map((doc, index) => (
                <div key={index}>• {doc.title || doc.filename || `Document ${doc.id}`}</div>
              ))}
              {context.documents.length > 3 && <div>... and {context.documents.length - 3} more</div>}
            </div>
          </div>
        </Card.Description>
      );
    }

    // Handle group context
    if (context.group) {
      const group = context.group;
      cardContent.push(
        <Card.Description key="group-desc">
          <Icon name="group" />
          <strong>Context</strong>
          <div style={{ marginTop: '0.5em' }}>
            <strong>Group:</strong> {group.name}
            {group.description && <div style={{ marginTop: '0.5em' }}>{group.description}</div>}
          </div>
        </Card.Description>
      );
    }

    // Handle custom context
    if (!context.document && !context.documents && !context.group) {
      // Generic context handling - show as formatted JSON
      cardContent.push(
        <Card.Description key="generic-desc">
          <Icon name="tag" />
          <strong>Context</strong>
          <pre style={{
            marginTop: '0.5em',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '0.9em',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            <code>{JSON.stringify(context, null, 2)}</code>
          </pre>
        </Card.Description>
      );
    }

    return (
      <div style={{ padding: '1px', marginBottom: '1em' }}>
        <Card fluid style={{ marginTop: '5px' }}>
          <Card.Content>
            {cardContent}
          </Card.Content>
        </Card>
      </div>
    );
  };

  render () {
    // Use local globalState reference instead of calling getGlobalState() on every render
    const globalState = this.globalState || {};
    // Remove excessive debug logging that was causing console spam
    // console.log('[CHATBOX] [RENDER] Render method called with state:', {
    //   generatingResponse: this.state.generatingResponse,
    //   isStreaming: this.state.isStreaming,
    //   streamingContent: this.state.streamingContent ? 'has content' : 'no content',
    //   streamingMessageId: this.state.streamingMessageId,
    //   globalStateMessagesCount: Object.keys(globalState.messages || {}).length
    // });

    const { isSending, placeholder, homePage, announTitle, announBody, conversationID, actualConversation, context, documentChat } = this.props;
    const { conversations } = this.props;
    const { loading, editLoading, isUploading, uploadProgress, formatError, errorMsg, unsupportedVideoWarning, attachingFile, editingTitle, showFilePreview, filePreview, generatingResponse, reGeneratingResponse, groupedMessages, query, windowWidth, windowHeight, checkingMessageID } = this.state;

    // Get messages from the correct source
    const messages = this.props.chat?.messages || [];

    // Ensure messages are always an array
    const safeMessages = Array.isArray(messages) ? messages : [];
    const allMessages = safeMessages;

    // Remove excessive debug logging that was causing console spam
    // console.debug('[CHATBOX]', 'Render - messages state:', {
    //   isStreaming: this.state.isStreaming,
    //   streamingMessageId: this.state.streamingMessageId,
    //   allMessagesCount: allMessages?.length,
    //   generatingResponse: this.state.generatingResponse,
    //   streamingContent: this.state.streamingContent?.substring(0, 50) + '...',
    //   shouldShowDirectStreaming: this.state.isStreaming && !!this.state.streamingContent
    // });

    // Use controlled input value if provided
    const inputValue = this.props.inputValue !== undefined ? this.props.inputValue : query;

    const AUTHORITY = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

    //this is the style of the chat container with no messages on the chat
    //the elements are on a flex-column but all together
    let chatContainerStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      transition: 'height 1s',
      width: '100%'
    };

    //when there are messages on the chat, it fits 98% of the parent height
    //and we put normally justify-content space-between, wich pushes the prompt bar to bottom
    //in cases where the screen is really tall (height > 1200px) and the screen is taller than wider
    //then we dont use space-between, this makes the prompt bar sticks to the last message of the chat
    if (safeMessages.length > 0) {
      chatContainerStyle = {
        ...chatContainerStyle,
        height: '98%',
        justifyContent: (windowHeight < 1200 || windowHeight < windowWidth) ? 'space-between' : ''
      };
    }

    const messagesContainerStyle = {
      overflowY: 'auto',
      transition: 'height 1s'
    };

    const announcementStyle = {
      minHeight: '5.5em',
      maxHeight: '14em',
      overflow: 'auto',
      marginTop: 0,
    };

    const controlsStyle = {
      border: 'none',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      paddingRight: '0.5em',
      paddingLeft: '0.5em',
    };

    const inputStyle = {
      resize: 'none',
      zIndex: '1',
      flex: '1',
      width: '100%'
    };

    if (this.props.includeAttachments) {
      inputStyle.borderRadius = '0 5px 5px 0';
      inputStyle.marginLeft = '0';
    }

    if (this.props.chat?.message?.conversation && !conversationID && !documentChat) {
      return <Navigate to={`/conversations/${this.props.chat.message.conversation}`} replace />;
    }

    return (
      <section style={chatContainerStyle}>
        {this.props.includeFeed && (<Feed style={messagesContainerStyle} className="chat-feed">
          {(conversationID && !actualConversation) && (
            <div className='conversation-title-container' >
              <Header as="h2" style={{ marginBottom: '0.3em' }}>Conversation #{conversationID}</Header>
            </div>
          )}
          {/* when we open a previous conversation, this is the title that shows */}
          {(conversationID && actualConversation) && (
            <div className='conversation-title-container fade-in' >
              {/* this is the call for the conversation title rendering, that lets you edit the title of the conversation */}
              {this.conversationTitle(this.state.editedTitle ? this.state.editedTitle : actualConversation.title)}
              {(this.props.documentInfo && !documentChat) && (
                <Popup
                  content="View related Document"
                  trigger={
                    <Icon
                      name='file alternate'
                      size='big'
                      className='primary'
                      primary
                      onClick={(e) => { e.stopPropagation(); this.props.documentInfoSidebar(this.props.documentInfo, this.props.documentSections ? this.props.documentSections : null, null); }}
                      style={{ cursor: "pointer" }}
                    />
                  }
                />
              )}
            </div>
          )}
          {/* when we start a new conversation for a document, the title is the filename */}
          {documentChat && (
            <div className='conversation-title-container'>
              <Header as="h2" style={{ marginBottom: '0.3em' }}>
                <Link onClick={(e) => { e.stopPropagation(); this.props.documentInfoSidebar(this.props.documentInfo, this.props.documentSections ? this.props.documentSections : null, null); }}>{this.props.documentInfo.filename || this.props.documentInfo.title}</Link>
              </Header>
            </div>
          )}
          {/* Context card - displayed when context is provided */}
          {!this.props.hideContext && this.renderContextCard()}


          {/* The chat messages start rendering here */}
          {(allMessages && allMessages.length > 0) ? this.groupMessages(allMessages).map((group, groupIndex) => {
            let message;

            //here it checks if the group message rendering is from assistant and if it has more than 1 message (because regenerated answers)
            if (group.messages[0].role === "assistant" && group.messages.length > 1) {
              //this is the active answer the user selected to read
              message = group.messages[group.activeMessageIndex];
            } else {
              message = group.messages[0];
            }

            if (message.attachments && message.attachments.length > 0) {
              message.attachments.forEach((attachment) => {
                const fileId = typeof attachment === 'string' ? attachment : (attachment.id || attachment.file_id);
                if (fileId) this.fetchFileMetadata(fileId);
              });
            }

            // Skip rendering messages with status "computing" when we're showing the placeholder
            if (message.role === "assistant" && message.status === "computing" && this.state.generatingResponse) {
              console.debug('[CHATBOX]', 'Skipping computing message:', message.id);
              return null;
            }

            // Remove excessive debug logging that was causing console spam
            // console.debug('[CHATBOX]', 'Rendering message:', {
            //   messageId: message.id,
            //   role: message.role,
            //   status: message.status,
            //   hasContent: !!message.content,
            //   contentLength: message.content?.length || 0,
            //   generatingResponse: this.state.generatingResponse,
            //   isStreaming: this.state.isStreaming,
            //   globalStateMessage: this.globalState.messages?.[message.id],
            //   hasGlobalStateContent: !!this.globalState.messages?.[message.id]?.content
            // });

            return (
              <Feed.Event key={message.id} data-message-id={message.id}>
                <Feed.Content>
                  {/* Actual content of message */}
                  <Feed.Summary className='info-assistant-header'>
                    <Feed.User>
                      <Link to={'/users/' + message.author}>{message.author || message.user_id}</Link>{" "}
                    </Feed.User>
                    <Feed.Date as='abbr' title={message.updated_at} className='relative'>{toRelativeTime(message.updated_at)}</Feed.Date>
                    {message.role === "assistant" && (
                      <div className="controls info-icon">
                        <Button.Group basic size='mini'>
                          <Popup
                            content="More information"
                            trigger={
                              <Button icon onClick={(e) => { e.stopPropagation(); this.props.messageInfo(message.id); }}>
                                <Icon
                                  name="info"
                                  color="blue"
                                  style={{ cursor: "pointer", marginLeft: "0.5rem" }}
                                />
                              </Button>
                            }
                          />
                          {/* the regenerate answer button only shows in the last answer */}
                          {/* group === this.state.groupedMessages[this.state.groupedMessages.length - 1] &&
                            message.role === "assistant" && !reGeneratingResponse && !generatingResponse && (
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
                            ) */}
                          {message.role === "assistant" && (
                            <Popup
                              content="Copied to clipboard"
                              on="click"
                              open={this.state.copiedStatus[message.id] || false}
                              trigger={
                                <Popup content='Copy to clipboard' trigger={
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.copyToClipboard(
                                        message.id,
                                        marked.parse(message.content)
                                      );
                                    }}
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
                              <Button icon onClick={(e) => { e.stopPropagation(); this.props.thumbsDown(message.id); }}>
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
                              <Button icon onClick={(e) => { e.stopPropagation(); this.props.thumbsUp(message.id); }}>
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
                    {/* Attachments rendering */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div style={{ marginTop: '0.5em' }}>
                        <ul style={{ marginTop: '0.5em', paddingLeft: '1.5em' }}>
                          {message.attachments.map((attachment, index) => {
                            let fileId, url, name;
                            if (typeof attachment === 'string') {
                              fileId = attachment;
                            } else if (attachment && typeof attachment === 'object') {
                              fileId = attachment.id || attachment.file_id;
                            }
                            const meta = fileId ? this.state.fileMetadataCache[fileId] : null;
                            url = meta ? `/files/${meta.id}` : (fileId ? `/files/${fileId}` : '#');
                            name = meta ? (meta.filename || meta.name || meta.originalname || meta.id) : (fileId || '');
                            return (
                              <li key={index}>
                                <a href={url} target="_blank" rel="noopener noreferrer">{name}</a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {(message.status !== "computing" || this.state.streamingContent || globalState.messages?.[message.id]?.content) && (
                      (() => {
                        // Unified content rendering logic
                        let contentToRender = message.content;

                        // Check if this is the streaming message and we have streaming content
                        const isStreamingMessage = (
                          this.state.streamingMessageId === message.id ||
                          this.state.streamingMessageId === message.fabric_id ||
                          this.state.streamingMessageId === message.message_id ||
                          this.state.streamingMessageId === message.local_id
                        );

                        // Priority: streaming content > global state content > message content
                        if (isStreamingMessage && this.state.streamingContent) {
                          contentToRender = this.state.streamingContent;
                        } else if (globalState.messages?.[message.id]?.content) {
                          // Use global state content (which should be the most up-to-date)
                          contentToRender = globalState.messages[message.id].content;
                        } else {
                          // Fallback to message content
                          contentToRender = message.content;
                        }

                        // Additional safety check: if we're streaming and have content, use it regardless
                        if (this.state.isStreaming && this.state.streamingContent &&
                            (this.state.streamingMessageId === message.id ||
                             this.state.streamingMessageId === message.fabric_id ||
                             this.state.streamingMessageId === message.message_id ||
                             this.state.streamingMessageId === message.local_id)) {
                          contentToRender = this.state.streamingContent;
                          // Remove excessive debug logging that was causing console spam
                          // console.debug('[CHATBOX]', 'Using streaming content for message:', {
                          //   messageId: message.id,
                          //   contentLength: contentToRender.length
                          // });
                        }

                        // If we have content but message status is still computing,
                        // treat it as if it has content (to avoid flickering)
                        if (message.status === 'computing' && contentToRender && contentToRender.length > 25) {
                          // Don't log every render - this was causing console spam
                          // console.debug('[CHATBOX]', 'Message has content but status is computing, treating as ready:', {
                          //   messageId: message.id,
                          //   contentLength: contentToRender.length,
                          //   status: message.status
                          // });

                          // Don't force update here - it causes infinite re-renders
                          // this.forceUpdate();
                        }

                        // Remove excessive debug logging that was causing console spam
                        // console.debug('[CHATBOX]', 'Rendering message content:', {
                        //   messageId: message.id,
                        //   status: message.status,
                        //   hasContent: !!contentToRender,
                        //   contentLength: contentToRender?.length || 0,
                        //   isStreamingMessage: isStreamingMessage,
                        //   hasStreamingContent: !!this.state.streamingContent
                        // });

                        return (
                          <span dangerouslySetInnerHTML={{ __html: marked.parse(contentToRender?.replace('https://sensemaker.io', AUTHORITY) || ""), }} />
                        );
                      })()
                    )}
                    {/* DO NOT DELETE THIS BLOCK */}
                    {/* {message.status !== "computing" && message.role === "assistant" && this.state.startedChatting && (
                      // <span dangerouslySetInnerHTML={{ __html: marked.parse(message.content?.replace('https://sensemaker.io', AUTHORITY) || ""), }} />
                      <Typewriter text={message.content?.replace('https://sensemaker.io', AUTHORITY) || ""} />
                    )}
                    {message.status !== "computing" && (message.role !== "assistant" || !this.state.startedChatting) &&(
                      <span dangerouslySetInnerHTML={{ __html: marked.parse(message.content?.replace('https://sensemaker.io', AUTHORITY) || ""), }} />
                      // <Typewriter text={message.content?.replace('https://sensemaker.io', AUTHORITY) || ""} />
                    )} */}
                  </Feed.Extra>
                  <Feed.Extra text>
                    {generatingResponse &&
                      group === this.state.groupedMessages[this.state.groupedMessages.length - 1] &&
                      !reGeneratingResponse && !this.state.isStreaming && (
                        <Header size="small" style={{ fontSize: "1em", marginTop: "1.5em" }}>
                          <Icon name="spinner" loading />
                          {BRAND_NAME} is generating a response...
                        </Header>
                      )}
                    {this.state.isStreaming &&
                      group === this.state.groupedMessages[this.state.groupedMessages.length - 1] && (
                        <Header size="small" style={{ fontSize: "1em", marginTop: "1.5em" }}>
                          <Icon name="spinner" loading />
                          {BRAND_NAME} is thinking...
                        </Header>
                      )}
                    {reGeneratingResponse &&
                      group ===
                      this.state.groupedMessages[this.state.groupedMessages.length - 1] && (
                        <Header
                          size="small"
                          style={{ fontSize: "1em", marginTop: "1.5em" }}
                        >
                          <Icon name="spinner" loading /> Sensemaker is trying again...
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
          }) : null}

          {/* Placeholder for computing messages or empty conversations */}
          {(() => {
            const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
            const shouldShow = this.state.generatingResponse && (
              !allMessages ||
              allMessages.length === 0 ||
              (lastMessage && lastMessage.role === 'assistant' && lastMessage.status === 'computing')
            );
            // Remove excessive debug logging that was causing console spam
            // console.log('[CHATBOX]', '[RENDER] Placeholder check:', {
            //   allMessagesLength: allMessages?.length || 0,
            //   generatingResponse: this.state.generatingResponse,
            //   lastMessageRole: lastMessage?.role,
            //   lastMessageStatus: lastMessage?.status,
            //   shouldShow: shouldShow
            // });
            return shouldShow && (
              <Feed.Event>
                <Feed.Content>
                  <Feed.Summary className='info-assistant-header'>
                    <Feed.User>
                      <Link to={'/users/sensemaker'}>sensemaker</Link>{" "}
                    </Feed.User>
                    <Feed.Date as='abbr' title={new Date().toISOString()} className='relative'>now</Feed.Date>
                  </Feed.Summary>
                  <Feed.Extra text>
                    <Header size="small" style={{ fontSize: "1em", marginTop: "1.5em" }}>
                      <Icon name="spinner" loading />
                      {BRAND_NAME} is thinking...
                    </Header>
                  </Feed.Extra>
                </Feed.Content>
              </Feed.Event>
            );
          })()}
        </Feed>)}
        {/* File Preview Component */}
        {this.state.showFilePreview && this.state.filePreview && (
          <div style={{
            ...this.filePreviewStyles.container,
            ...(this.state.showFilePreview ? this.filePreviewStyles.visible : {})
          }}>
            <div style={this.filePreviewStyles.content}>
              <Icon name='file' />
              <div style={this.filePreviewStyles.fileName}>
                <strong>{this.state.filePreview.name}</strong>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {this.state.filePreview.size}
                </div>
                {this.state.isUploading && (
                  <Progress
                    percent={this.state.uploadProgress}
                    size='tiny'
                    color='blue'
                    style={{ marginTop: '5px', marginBottom: '0' }}
                  >
                    {this.state.uploadProgress === 100 ? 'Upload Complete' : 'Uploading...'}
                  </Progress>
                )}
                {this.state.formatError && (
                  <Message negative size='tiny' style={{ marginTop: '5px', padding: '5px' }}>
                    {this.state.errorMsg || 'Invalid file format'}
                  </Message>
                )}
                {this.state.unsupportedVideoWarning && (
                  <Message warning size='tiny' style={{ marginTop: '5px', padding: '5px' }}>
                    <Message.Header style={{ fontSize: '0.8em' }}>Video Format Warning</Message.Header>
                    This video format may not play in browsers. Consider converting to MP4 for better compatibility.
                  </Message>
                )}
              </div>
              <Icon
                name='close'
                style={this.filePreviewStyles.removeButton}
                onClick={this.removeFile}
              />
            </div>
          </div>
        )}
        <Form
          id='input-control-form'
          size="big"
          onSubmit={this.handleSubmit.bind(this)}
          loading={loading}>
          <Form.Input style={{ display: 'flex', width: '100%' }}>
            {this.props.includeAttachments && (
              <Button size='huge' basic left attached icon onClick={this.handleAttachmentIntent} loading={this.state.loading} style={{ borderBottomLeftRadius: '5px', borderTopLeftRadius: '5px' }}>
                <input hidden type='file' name='file' accept={ALLOWED_UPLOAD_TYPES.join(',')} onChange={this.handleFileChange} />
                <Icon name='paperclip' color='grey' style={{ color: this.state.isTextareaFocused ? 'grey' : 'grey', cursor: 'pointer' }} />
              </Button>
            )}
            <TextareaAutosize
              id="primary-query"
              className="prompt-bar"
              name="query"
              required
              placeholder={placeholder}
              onChange={this.handleChange}
              disabled={isSending}
              loading={isSending}
              value={inputValue}
              maxRows={5}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  this.handleSubmit(e);
                }
              }}
              onFocus={this.handleTextareaFocus}
              onBlur={this.handleTextareaBlur}
              style={inputStyle}
            />
            <Icon
              name={this.state.isRecording ? "stop" : "microphone"}
              color={this.state.isRecording ? "red" : "grey"}
              onClick={this.handleMicrophoneClick}
              style={{
                color: this.state.isTextareaFocused ? 'grey' : 'lightgrey',
                cursor: 'pointer'
              }}
            />
          </Form.Input>
        </Form>
      </section>
    );
  }

  scrollToBottom = () => {
    if (this.props.messagesEndRef && this.props.messagesEndRef.current) {
      this.props.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
}

module.exports = ChatBox;
