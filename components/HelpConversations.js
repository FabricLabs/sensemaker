'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Segment,
  Button,
  Icon,
  Input
} = require('semantic-ui-react');
const HelpChat = require('./HelpChat');


class HelpConversations extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      open: true,
      // messageQuery: '',
      conversationID: 0,
    };
  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps) {

  }

  // handleInputChange = (event) => {
  //   this.setState({
  //     [event.target.name]: event.target.value
  //   });
  // };

  // handleKeyDown = (event) => {
  //   if (event.key === 'Enter') {
  //     this.sendMessage();
  //     event.preventDefault();
  //   }
  // };

  // sendMessage = () => {
  //   console.log("Message sent:", this.state.messageQuery);
  //   this.setState({ messageQuery: '' });
  // };



  render() {

    return (
      <Segment fluid
        style={{ width: '100%', height: '100%', color: 'black' }}
      >
        <HelpChat
          fetchHelpMessages={this.props.fetchHelpMessages}
          sendHelpMessage={this.props.sendHelpMessage}
          help={this.props.help}
          conversationID = {this.state.conversationID}
        />

      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = HelpConversations;
