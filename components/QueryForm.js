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
    };

    this.messagesEndRef = React.createRef();
    this.fetchAnnouncement = this.fetchAnnouncement.bind(this);
  }
 
  componentDidMount() {
    $('#primary-query').focus();
    this.props.resetChat();

    this.fetchAnnouncement();
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
    const {announTitle, announBody} = this.state;
    const { messages } = this.props.chat;

    const VERTICAL_MARGIN = '2.5';

    const componentStyle = messages.length>0 ? {
      display: 'absolute',
      left: 'calc(350px + 1em)',
      height: `calc(100vh - ${VERTICAL_MARGIN}rem)`, // Set a maximum height
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '0'
    } : {
      height: `calc(100vh - ${VERTICAL_MARGIN}rem)`,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '0'
    };
   
    return ( 
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
        <ChatBox
            {...this.props}
            resetInformationSidebar={this.props.resetInformationSidebar}
            chatBoxInfoSidebar={this.props.chatBoxInfoSidebar}
            thumbsUp={this.props.thumbsUp}
            thumbsDown={this.props.thumbsDown}
            announTitle={announTitle}
            announBody={announBody}
            placeholder={this.props.placeholder}
            messagesEndRef={this.messagesEndRef}
            homePage={true}
            size='large'
          />
      </fabric-component>
    );
  }
}

module.exports = Chat;
