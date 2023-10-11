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
    const { message } = this.props.cases;
    
    this.props.fetchCase(id);
    console.log(this.props);
  }

  render () {
    const { id, loading, error, cases, messages } = this.props;

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <fabric-container>
        <Segment fluid loading={loading} style={{ marginRight: '1em'}}>
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

        <CaseChat
            fetchConversations={this.props.fetchConversations}
            getMessages={this.props.getMessages}
            submitMessage={this.props.submitMessage}
            onMessageSuccess={this.props.onMessageSuccess}
            resetChat={this.props.resetChat}
            chat={this.props.chat}
            includeFeed={true}
            isSending={loading}
            placeholder="Ask me anything about this case..."
            caseTitle={cases.current.title}
            caseId={id}
          />
      </fabric-container>
    );
  }
}

function Chat (props) {
  const { id } = useParams();
  return <Conversation id={id} {...props} />;
}

module.exports = Chat;