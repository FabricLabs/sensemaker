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

const CaseChat = require('./CaseChat');
const formatDate = require('../contracts/formatDate');

class Conversation extends React.Component {
  componentDidMount () {
    const { id } = this.props;
    const { message } = this.props.courts;

    this.props.fetchCourt(id);
    console.log(this.props);
  }

  render () {
    const { id, loading, error, courts } = this.props;
    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <fabric-container>
        <Segment fluid loading={loading} className='court-info'>
          <Header as='h2'>{courts.current.short_name} ({courts.current.decision_date})</Header>
          <Header as='h3'>{courts.current.title}</Header>
          <Label.Group>
            <Label icon='calendar'>{formatDate(courts.current.founded_date)}</Label>
            <Label icon='law'>{courts.current.court_name}</Label>
          </Label.Group>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(courts.current.summary || '') }} />
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

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat (props) {
  const { id } = useParams();
  return <Conversation id={id} {...props} />;
}

module.exports = Chat;
