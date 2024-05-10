'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Segment,
  Button,
  Icon,
  Menu,
  Label
} = require('semantic-ui-react');
const HelpChat = require('./HelpChat');


class HelpFaq extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {

    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (prevProps.help != this.props.help) {
      console.log(this.props.help);
    }
  }

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  closeHelpChat = () => {
  }

  render() {
    const { help } = this.props;

    return (
      <Segment fluid
        style={{ width: '100%', height: '100%', color: 'black' }}
      >



      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = HelpFaq;
