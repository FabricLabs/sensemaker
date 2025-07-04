'use strict';

// Dependencies
const React = require('react');
const $ = require('jquery');

// React
const store = require('../stores/redux');

// Components
const ChatBox = require('./ChatBox');

// Semantic UI
const {
  Progress,
  Segment
} = require('semantic-ui-react');

class Chat extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      announTitle: '',
      announBody: '',
      inputText: '',
      isTyping: false
    };

    this.messagesEndRef = React.createRef();
    this.fetchAnnouncement = this.fetchAnnouncement.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.countTokens = this.countTokens.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
  }

  componentDidMount () {
    $('#primary-query').focus();
    this.props.resetChat();

    this.fetchAnnouncement();
  }

  countTokens (text) {
    if (!text) return 0;
    // Simple word-based tokenization - can be replaced with more sophisticated method
    return text.trim().split(/\s+/).length;
  }

  handleInputChange (event) {
    const text = event.target.value;
    this.setState({
      inputText: text,
      isTyping: text.trim().length > 0  // Only consider it typing if there's non-whitespace content
    });
  }

  handleSendMessage () {
    // TODO: Implement actual message sending logic
    if (this.state.inputText.trim()) {
      // Call parent component's message handler here
      this.setState({
        inputText: '',
        isTyping: false
      });
    }
  }

  fetchAnnouncement = async () => {
    const state = store.getState();
    const token = state.auth.token;

    try {
      const fetchPromise = fetch('/announcements/latest', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Fetch timed out"));
        }, 15000);
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const announcement = await response.json();
      const today = new Date();
      const expirationDate = announcement.expiration_date ? new Date(announcement.expiration_date) : null;
      const createdAt = new Date(announcement.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const isValidExpiration = expirationDate && expirationDate > today;
      const isValidCreation = !expirationDate && createdAt > thirtyDaysAgo;

      if (isValidExpiration || (!expirationDate && isValidCreation)) {
        if (announcement.title) {
          this.setState({ announTitle: announcement.title })
        }
        if (announcement.body) {
          this.setState({ announBody: announcement.body })
        }
      }
    } catch (error) {
      // console.log('Error fetching announcements from API:', error);
    }
  };

  render () {
    const {announTitle, announBody, inputText, isTyping} = this.state;
    const { messages } = this.props.chat;
    const VERTICAL_MARGIN = '2.5';
    const componentStyle = messages.length > 0 ? {
      display: 'absolute',
      left: 'calc(350px + 1em)',
      height: `calc(100vh - ${VERTICAL_MARGIN}rem)`,
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '0'
    } : {
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '1em'
    };

    const tokenCount = this.countTokens(inputText);
    const requestCost = this.props.requestCost || 0; // Default to 0 if not provided

    return (
      <sensemaker-query-form ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
        <ChatBox
          {...this.props}
          resetInformationSidebar={this.props.resetInformationSidebar}
          messageInfo={this.props.messageInfo}
          thumbsUp={this.props.thumbsUp}
          thumbsDown={this.props.thumbsDown}
          announTitle={announTitle}
          announBody={announBody}
          placeholder={this.props.placeholder}
          messagesEndRef={this.messagesEndRef}
          homePage={true}
          size='large'
          takeFocus={this.props.takeFocus}
          onInputChange={this.handleInputChange}
          inputValue={inputText}
        />
        {isTyping && (
          <div className="token-counter-wrapper" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div className={`token-counter ${isTyping ? 'slide-up' : ''}`} style={{ marginTop: '0.5em', marginBottom: '0.5em' }}>
              <small className="token-count" style={{ marginRight: '0.5em' }}><em>{tokenCount} tokens ({requestCost} satoshi)</em></small>
              <button
                className="ui icon button mini primary"
                onClick={this.handleSendMessage}
                disabled={!inputText.trim()}
              >
                <i className="paper plane icon"></i>
              </button>
            </div>
          </div>
        )}
      </sensemaker-query-form>
    );
  }
}

module.exports = Chat;
