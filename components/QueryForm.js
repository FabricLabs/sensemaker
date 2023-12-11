'use strict';

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');

const store = require('../stores/redux');
const ChatBox = require('./ChatBox');

// Semantic UI
const {
  Header,
  Image, 
  Feed,
  Message  
} = require('semantic-ui-react');


class Chat extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      hasSubmittedMessage: false,
      announTitle:'',
      announBody:'',
      windowWidth: window.innerWidth
    };

    this.messagesEndRef = React.createRef();
    this.fetchAnnouncement = this.fetchAnnouncement.bind(this);
  }
 
  componentDidMount() {
    $('#primary-query').focus();
    this.props.resetChat();
    window.addEventListener('resize', this.handleResize);

    this.fetchAnnouncement();
  }  

  componentWillUnmount () {
    this.setState({
      hasSubmittedMessage: false,
    });
    window.removeEventListener('resize', this.handleResize);

  }

  fetchAnnouncement = async () => {

    const state = store.getState();
    const token = state.auth.token;

    try {
      const fetchPromise = fetch('/announcementFetch', {
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
      console.log('Error fetching announcements from API:', error);
    }
  };

  handleResize = () => {
    // Force a re-render when the window resizes
    this.setState({ windowWidth: window.innerWidth });
    this.forceUpdate();
  };
  render () {
    const {announTitle, announBody,windowWidth} = this.state;
    const { messages } = this.props.chat;

    const messageContainerStyle = messages.length>0 ? {
      flexGrow: 1,
      paddingBottom: '3rem',
      transition: 'height 1s',
      overflowY: 'auto',
      transition: 'max-height 1s',
      maxWidth: '98%', 
    } : {
      transition: 'height 1s',      
    };

    const componentStyle = messages.length>0 ? {
      display: 'absolute',
      top: '1em',
      left: 'calc(350px + 1em)',
      maxHeight: 'calc(100vh - 3rem)', // Set a maximum height
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column', 
    } : {
      height: 'calc(100vh - 3rem)',
      display: 'flex',
      flexDirection: 'column',  
    };

    const inputStyle = messages.length>0 ? {
      position: 'fixed',
      bottom: '1.25em',
      right: '1.25em',
      paddingRight: '0.2em'      
    } : {
      left: '0',
      maxWidth: '80vw !important',
      position: 'relative',
    };
        
    if(inputStyle.position === 'fixed'){
      if (windowWidth < 820){
        inputStyle.left = '1.25em';
      }else{
        inputStyle.left = 'calc(350px + 1.25em)';      
      }
    } 

    const minAnnounHeight = windowWidth < 1440 ? '5.5em' : '3em';
    
    const announcementStyle =  {
      minHeight: minAnnounHeight,
      maxHeight: '14em',
      overflow: 'auto',    
    };
    
    return (  
       <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
         {/* <Button floated='right' onClick={this.handleClick.bind(this)}><Icon name='sync' /></Button> */}
         {((announTitle || announBody) && (messages.length == 0) ) && (             
                <Message info style={announcementStyle}>
                  <Message.Header >
                    <span dangerouslySetInnerHTML={{ __html: marked.parse(announTitle) }} />
                  </Message.Header>
                  <Message.Content >
                    <span dangerouslySetInnerHTML={{ __html: marked.parse(announBody) }} />
                  </Message.Content>
                </Message>              
            )
            }
          <Feed.Extra text style={{ display: 'flex' }}>
            <Image src='/images/jeeves-brand.png' size='small' floated='left' />
            <div style={{ paddingTop: '2em', maxWidth: '10em' }}>
              <p><strong>Hello,</strong> I'm <abbr title="Yes, what about it?">JeevesAI</abbr>, your legal research companion.</p>
            </div>

          </Feed.Extra>
          <Header style={{ marginTop: '0em'}}>How can I help you today?</Header> 

          <ChatBox 
             {...this.props}   
             messageContainerStyle={messageContainerStyle}
             inputStyle={inputStyle} 
             hasSubmittedMessage={this.state.hasSubmittedMessage}
             updateHasSubmittedMessage={(value) => this.setState({ hasSubmittedMessage: value })}
             placeholder={this.props.placeholder}
             messagesEndRef={this.messagesEndRef}
             homePage={true}
           />        

       </fabric-component>
    );
  }
}

module.exports = Chat;