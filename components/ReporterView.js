'use strict';

const marked = require('marked');

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Card,
  Header,
  Icon,
  Label,
  Loader,
  Segment
} = require('semantic-ui-react');

// const QueryForm = require('./QueryForm');
// const Feed = require('./Feed');

const CaseChat = require('./CaseChat');
const formatDate = require('../contracts/formatDate');

class ReporterView extends React.Component {

  componentDidMount() {
    const { id } = this.props;
    this.props.fetchReporter(id);

  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.props.fetchReporter(this.props.id);
    }

  }

  render() {
    const { error, reporters } = this.props;

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <Segment className='col-center' style={{ height: '97vh' }} loading={reporters.loading}>
        <Segment fluid>
          <Header as='h2'>{reporters.current.name}</Header>
          <Header as='h3'>{reporters.current.name_short}</Header>
          <Label.Group>
            <Label icon='calendar'>Start Year: {formatDate(reporters.current.start_year)}</Label>
            <Label icon='calendar'>End Year: {formatDate(reporters.current.end_year)}</Label>
          </Label.Group>
        </Segment>
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat(props) {
  const { id } = useParams();
  return <ReporterView id={id} {...props} />;
}

module.exports = Chat;
