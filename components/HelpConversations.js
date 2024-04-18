'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Segment,
  Button,
  Icon
} = require('semantic-ui-react');

class HelpConversations extends React.Component {
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
      <Segment fluid 
        style={{ width:'100%', height: '100%', color: 'black' }}
      >
        <p>test</p>
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = HelpConversations;
