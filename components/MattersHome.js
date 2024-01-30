'use strict';

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

  componentDidUpdate(prevProps) {
    const { matters } = this.props;
    if (prevProps.matters !== matters) {
      // if (!matters.loading) {
      //   this.setState({ loading: false });
      // }
    }
  };


  render() {
    const { matters } = this.props;
    const { loading } = this.state;

    return (
      <Segment loading={matters.loading} style={{marginRight: '1em'}}>
        <Header as='h1'>My Matters</Header>
        <List>
          {matters && matters.matters && matters.matters
            .map(instance => {
              return (
                <List.Item><Header as='h3'><Link to={"/matter/" + instance.id}>{instance.title}</Link></Header></List.Item>
              )
            })}
        </List>
        <Link to={"/matters/new"}>+ New Matter </Link>
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
