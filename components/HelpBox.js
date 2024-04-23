'use strict';

const debounce = require('lodash.debounce');
const fetch = require('cross-fetch');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const HelpConversations = require('./HelpConversations');

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
    };
  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps) {

  }


  render() {

    return (
      <Segment className="fade-in" id='help-box' fluid style={{ padding: '0', maxHeight: '100%', width: '350px', height: '600px' }}>
        <section style={{ height: '90%', color: 'white', marginBottom: '0', padding: '1em', display: 'flex', flexDirection: 'column' }}>
          <Header as='h3' fluid textAlign='center' style={{ flex: 'none', color: 'white' }}>Conversations</Header>
          <div style={{ flex: '1', overflowY: 'auto' }}>
            <HelpConversations
              fetchHelpConversations={this.props.fetchHelpConversations}
              fetchHelpMessages={this.props.fetchHelpMessages}
              sendHelpMessage={this.props.sendHelpMessage}
              help={this.props.help}
            />
          </div>
        </section>
        <Button.Group style={{ width: '100%', height: '10%' }}>
          <Button icon style={{ backgroundColor: 'white', paddingTop: '0.5em', fontWeight: '400' }} className='col-center'>
            <Icon name='home' size='big' />
            <p>Home</p>
          </Button>

          <Button icon style={{ backgroundColor: 'white', paddingTop: '0.5em', fontWeight: '400' }} className='col-center'>
            <Icon name='chat' size='big'/>
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
