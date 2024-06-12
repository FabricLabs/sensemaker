'use strict';

const marked = require('marked');

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Header,
  Label,
  Segment,
  CardDescription,
  CardContent,
  Card,
  Icon,
  Button
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class DocumentView extends React.Component {

  componentDidMount() {
    const { fabricID } = this.props;
    this.props.fetchDocument(fabricID);

  }

  componentDidUpdate(prevProps) {
    if (prevProps.fabricID !== this.props.fabricID) {
      this.props.fetchDocument(this.props.fabricID);
    }
    console.log(this.props.documents.document);
  }

  render() {
    const { documents } = this.props;

    return (
      <Segment className='col-center' style={{ height: '97vh' }} loading={documents.loading}>
        <Segment fluid style={{ width: '100%', paddingBottom: '3em', overflowY: 'hidden' }}>
          {documents.document.fabric_id ? (<section>
            <div className='document-file-header'>
              <Header as='h3' style={{ margin: 0 }}>{documents.document.title}</Header>
              <Header as="h3" style={{ margin: 0 }}><Link to={"/documents"}><Icon name='left chevron' /> Back to documents</Link></Header>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '1em' }}>
              <Label><Icon name='calendar' />Created at: {formatDate(documents.document.created_at)}</Label>
              <Label><Icon name='calendar' />Modified at: {formatDate(documents.document.created_at)}</Label>
            </div>
            <Link to={'/conversations/documents/' + documents.document.fabric_id} style={{ marginBottom: '2.5em' }} onClick={() => this.props.resetChat()}>
              <Button
                primary
                content='Start Conversation'
              />
            </Link>
          </section>
          ) : (
            <div className='document-file-header'>
              <Header as='h3' style={{ margin: 0 }}>Document Not Found</Header>
              <Header as="h3" style={{ margin: 0 }}><Link to={"/documents"}><Icon name='left chevron' /> Back to documents</Link></Header>
            </div>
          )}
        </Segment>
        {documents.document.file_id && (
          <Segment style={{ width: '100%', height: '100%' }}>
            <iframe
              src={`${window.location.protocol}//${window.location.hostname}:${window.location.port}/files/serve/${documents.document.file_id}`}
              className='document-frame'
            ></iframe>
          </Segment>
        )}
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat(props) {
  const { fabricID } = useParams();
  return <DocumentView fabricID={fabricID} {...props} />;
}

module.exports = Chat;
