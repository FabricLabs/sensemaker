'use strict';

const marked = require('marked');

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Card,
  Grid,
  Header,
  Label,
  Segment
} = require('semantic-ui-react');

// const QueryForm = require('./QueryForm');
// const Feed = require('./Feed');

const CaseChat = require('./CaseChat');
const formatDate = require('../contracts/formatDate');

class CaseView extends React.Component {
  componentDidMount () {
    const { id } = this.props;
    const { message } = this.props.cases;

    this.props.fetchCase(id);
    console.log(this.props);
  }

  render () {
    const { id, loading, error, cases } = this.props;
    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <fabric-container>
        <Segment fluid loading={loading} className='case-info'>
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
        <Grid columns='equal'>
          <Grid.Row stretched>
            <Grid.Column>
              <Segment>
                <Header as='h4'>People</Header>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                <Header as='h4'>Cites</Header>
                <Header as='h4'>Cited By</Header>
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <CaseChat
            fetchConversations={this.props.fetchConversations}
            getMessages={this.props.getMessages}
            submitMessage={this.props.submitMessage}
            regenAnswer={this.props.regenAnswer}
            onMessageSuccess={this.props.onMessageSuccess}
            resetChat={this.props.resetChat}
            chat={this.props.chat}
            includeFeed={true}
            isSending={loading}            
            caseTitle={cases.current.title}
            caseID={id}
          />
      </fabric-container>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat (props) {
  const { id } = useParams();
  return <CaseView id={id} {...props} />;
}

module.exports = Chat;
