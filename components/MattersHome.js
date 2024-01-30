'use strict';

const {
  BRAND_NAME
} = require('../constants');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Card,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Icon
} = require('semantic-ui-react');

class MattersHome extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    this.props.fetchMatters();
  }


  render() {
    const { matters } = this.props;
    const { loading } = this.state;



    return (
      <Segment>
        <Header as='h1'>My Matters</Header>
      </Segment>
    );
  }

  _toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML() {
    return this._toHTML();
  }
}

module.exports = MattersHome;
