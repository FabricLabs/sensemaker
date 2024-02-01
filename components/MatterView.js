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
    console.log("el id", this.props.id);
    this.props.fetchMatter(this.props.id);
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
    console.log("el matter", matters);
    console.log("el id", this.props.id);

    return (
      <Segment loading={matters.loading} style={{marginRight: '1em'}}>
        <Header as='h1'>{this.props.id}</Header>
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
  const { id } = useParams();
  return <MatterView id={id} {...props} />;
}
module.exports = MattView;