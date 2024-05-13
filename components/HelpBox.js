'use strict';

const debounce = require('lodash.debounce');
const fetch = require('cross-fetch');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const HelpConversations = require('./HelpConversations');
const HelpFaq = require('./HelpFaq');

const {
  Segment,
  Button,
  Icon,
  Popup,
  Header
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class HelpBox extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      open: true,
      windowHeight: window.innerHeight,
      showFaq: true,
      showFaqMenu: true,
      showConversations: false,
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.setState({ showFaq: true, showConversations: false });
    }

  }

  handleResize = () => {
    // Force a re-render when the window resizes
    this.setState({ windowHeight: window.innerHeight, });
    this.forceUpdate();
  };

  toggleFaqMenu = () => {
    this.setState(prevState => ({
      showFaqMenu: !prevState.showFaqMenu
    }));
  };


  render() {
    const { windowHeight, showFaq, showFaqMenu, showConversations } = this.state;

    //a few fixes for laptops and bigger screens
    const heightStyle = windowHeight > 720 ? { height: '650px' } : { height: '450px' };
    const chatStyle = windowHeight > 720 ? { height: '90%' } : { height: '87%' };
    const displayStyle = this.props.open ? {} : { display: 'none' };

    return (
      <Segment className="fade-in" id='help-box' fluid style={{ ...heightStyle, ...displayStyle, padding: '0', maxHeight: '100%', width: '350px', overflowY: 'hidden' }}>
        <section style={{ ...chatStyle, color: 'white', marginBottom: '0', padding: '1em', paddingTop: '1.5em', display: 'flex', flexDirection: 'column' }}>
          {showFaq ?
            (<Header as='h3' fluid textAlign='center' style={{ flex: 'none', color: 'white' }}>FAQ</Header>) :
            (<Header as='h3' fluid textAlign='center' style={{ flex: 'none', color: 'white' }}>Conversations</Header>)
          }
          <div style={{ flex: '1', overflowY: 'auto' }}>
            {showFaq ? (
              <HelpFaq
                openHelpChat={() => this.setState({ showFaq: false, showConversations: true })}
                showFaqMenu={showFaqMenu}
                toggleFaqMenu={() => this.toggleFaqMenu()}
              />
            ) :
              (
                <HelpConversations
                  fetchHelpConversations={this.props.fetchHelpConversations}
                  fetchHelpMessages={this.props.fetchHelpMessages}
                  sendHelpMessage={this.props.sendHelpMessage}
                  markMessagesRead={this.props.markMessagesRead}
                  help={this.props.help}
                />
              )}

          </div>
        </section>
        <Button.Group style={{ width: '100%', height: '10%' }}>
          <Button
            icon
            style={{ backgroundColor: 'white', paddingTop: '0.5em', fontWeight: '400' }}
            className='col-center' onClick={() => this.setState({ showFaq: true, showConversations: false, showFaqMenu: true })}>
            <Icon name='home' size='big' />
            <p>Home</p>
          </Button>

          <Button
            icon
            style={{ backgroundColor: 'white', paddingTop: '0.5em', fontWeight: '400' }}
            className={`col-center ${this.props.notification ? 'notify-active' : ''}`}
            onClick={() => { this.setState({ showFaq: false, showConversations: true }); this.props.stopNotification(); this.forceUpdate(); }}>
            <Icon name='chat' size='big' />
            <p>Messages</p>
          </Button>
        </Button.Group>
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = HelpBox;
