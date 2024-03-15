'use strict';

const marked = require('marked');

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Card,
  Dimmer,
  Grid,
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

class DocumentView extends React.Component {
  
  componentDidMount() {
    const { id } = this.props;
    const { message } = this.props.cases;
    this.props.resetChat();
    this.props.fetchDocument(id);

  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.props.resetChat();
      this.props.fetchDocument(this.props.id);
    }

  }

  render() {
    const { id, loading, error, cases } = this.props;

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <Segment className='col-center' style={{maxHeight: '97vh'}}>
        <Segment fluid loading={this.props.cases.loading} className='case-info'>
          <Header as='h2'>{cases.current.short_name} ({cases.current.decision_date})</Header>
          <Header as='h3'>{cases.current.title}</Header>
          <Label.Group>
            <Label icon='calendar'>{formatDate(cases.current.decision_date)}</Label>
            <Label icon='law'>{cases.current.court_name}</Label>
            {(cases.current.jurisdiction_name) ? (
              <Label icon='law'>{cases.current.jurisdiction_name || ''}</Label>
            ) : null}
            {(cases.current.harvard_case_law_pdf) ? (
              <a href={cases.current.harvard_case_law_pdf} target='_blank'><Icon name='file pdf' /></a>
            ) : null}
          </Label.Group>
          {(cases.current.summary) ? (
            <div dangerouslySetInnerHTML={{ __html: marked.parse(cases.current.summary || '') }} />
          ) : (
            <Loader />
          )}
          <div style={{ marginTop: '1em' }}>
            <Header as='h6'>Metadata</Header>
            <code>
              <pre>
                @id: {id}<br />
                @ids:<br />
                &nbsp;&nbsp;PACER: {cases.current.pacer_case_id || 'unknown'}<br />
                &nbsp;&nbsp;harvard: {cases.current.harvard_case_law_id || 'unknown'}<br />
                &nbsp;&nbsp;courtlistener: {cases.current.courtlistener_id || 'unknown'}
              </pre>
            </code>
          </div>
        </Segment>
        <div style={{width: '100%'}}>
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
        </div>
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
          getMessageInformation={this.props.getMessageInformation}
          resetInformationSidebar={this.props.resetInformationSidebar}
          messageInfo={this.props.messageInfo}
          thumbsUp={this.props.thumbsUp}
          thumbsDown={this.props.thumbsDown}
        />
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat(props) {
  const { id } = useParams();
  return <DocumentView id={id} {...props} />;
}

module.exports = Chat;
