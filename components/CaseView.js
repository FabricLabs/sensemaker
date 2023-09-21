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
  Label,
  Segment
} = require('semantic-ui-react');

// const QueryForm = require('./QueryForm');
// const Feed = require('./Feed');

const formatDate = require('../contracts/formatDate');

class Conversation extends React.Component {
  componentDidMount () {
    const { id } = this.props;
    const { message } = this.props.cases;

    this.props.fetchCase(id);
  }

  render () {
    const { id, loading, error, cases, messages } = this.props;

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <fabric-container>
        <Segment fluid loading={loading}>
          <Header as='h2'>{cases.current.short_name} ({cases.current.decision_date})</Header>
          <Header as='h3'>{cases.current.title}</Header>
          <Label.Group>
            <Label icon='calendar'>{formatDate(cases.current.decision_date)}</Label>
            <Label icon='law'>{cases.current.court_name}</Label>
          </Label.Group>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(cases.current.summary || '') }} />
          <div style={{ marginTop: '1em' }}>
            <Header as='h6'>Metadata</Header>
            <code>
              <pre>
                @id: {id}
              </pre>
            </code>
          </div>
        </Segment>
      </fabric-container>
    );
  }
}

function Chat (props) {
  const { id } = useParams();
  return <Conversation id={id} {...props} />;
}

module.exports = Chat;
