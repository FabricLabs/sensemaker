'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams } = require('react-router-dom');

const {
  Card,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Icon,
  Button,
  Form
} = require('semantic-ui-react');

class MatterView extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    //this.props.fetchMatters();
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
        <Header as='h1'>{this.props.matterID}</Header>
        <Form>
        </Form>
 
        <Link to={"/matters/"}>Back to Matters </Link>
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

function MattView(props) {
  const { matterID } = useParams();
  return <MatterView matterID={matterID} {...props} />;
}
module.exports = MattView;
