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
  Icon
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
      <Segment className="fade-in" id='help-box' fluid style={{ padding: '0', maxHeight: '100%', width: '350px', height: '500px' }}>
        <section style={{ height: '90%', color: 'white', marginBottom: '0', padding: '1em' }}>
          <HelpConversations/>
        </section>
        <Button.Group style={{ width: '100%', height: '10%' }}>
          <Button icon style={{
            backgroundColor: 'white'
          }}>
            <Icon name='home' size='big'/>
          </Button>
          <Button icon style={{
            backgroundColor: 'white'
          }}>
            <Icon name='chat' size='big'/>
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
