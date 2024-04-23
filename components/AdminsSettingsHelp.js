'use strict';

const React = require('react');

const {
  Button,
  Table,
  Message,
  Header,
  Segment,
  Input,
  Modal
} = require('semantic-ui-react');
const store = require('../stores/redux');

class AdminHelp extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      conversation_id: null,
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {

  };

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  render() {
    const { conversation_id } = this.state;
    const { help } = this.props;

    return (
      <Segment></Segment>
    );
  };
}


module.exports = AdminHelp;
