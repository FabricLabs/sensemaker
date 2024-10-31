'use strict';

const {
  ENABLE_LOGIN
} = require('../constants');

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Card,
  Form,
  Button,
  Icon,
  Header,
  Image,
  Input,
  Label,
  Message,
  Segment
} = require('semantic-ui-react');

// Components
const QueryCounter = require('./QueryCounter');

class MenuBar extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      email: '',
      error: null,
      loading: false,
      joined: false,
      showBack: true,
      showBrand: true
    };
  }

  render () {
    return (
      <div style={{ width: '100%' }}>
        {/* <QueryCounter {...this.props} simplified={true} style={{ float: 'right', width: '16em' }} /> */ }
        {this.props.showBack && <Button onClick={() => { history.back(); }} icon><Icon name='left chevron' /> Back</Button>}
      </div>
    );
  }
}

module.exports = MenuBar;
