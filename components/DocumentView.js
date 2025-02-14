'use strict';

const debounce = require('lodash.debounce');
const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Header,
  Label,
  Segment,
  Icon,
  Button,
  Input,
  Modal,
  Form,
  Popup,
  Message,
  List
} = require('semantic-ui-react');

const TextareaAutosize = require('react-textarea-autosize').default;

const ChatBox = require('./ChatBox');
const formatDate = require('../functions/formatDate');

class DocumentView extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      content: null,
      editMode: false,
      editSection: 0,
      editSectionTitle: '',
      editSectionContent: '',
      hoverSection: -1,
      creatingSection: false,
      modalOpen: false,
      editDocument: false,
      editDocumentTitle: '',
      creationError: false,
    };

    return this;
  }


  componentDidMount () {
    const { fabricID } = this.props;
    this.props.fetchDocument(fabricID);

  }

  componentDidUpdate (prevProps) {
    const { documents } = this.props;
    if (prevProps.fabricID !== this.props.fabricID) {
      this.props.fetchDocument(this.props.fabricID);
    }

    if (prevProps.documents != documents) {
      console.log('[SENSEMAKER]', 'Document:', this.props.documents.document);
    }
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  formatContent (content) {
    return content.split('\n').map((line, index) => (
      <p key={index} style={{ marginBottom: '0' }}>{line}</p>
    ));
  }
  
  handleContentChange = debounce((event) => {
    const { document } = this.props.documents;
    this.props.editDocument(document.id, { content: event.target.innerHTML });
  }, 1000);

  handleTitleEdit = () => {
    const { document } = this.props.documents;
    const { editDocumentTitle } = this.state;
    this.props.editDocument(document.id, { title: editDocumentTitle });
    this.setState({ editMode: false, editDocument: false, editDocumentTitle: '' })
    console.log(this.state.editDocumentTitle);
  }

  render () {
    const { documents } = this.props;
    const {
      editMode,
      editSection,
      hoverSection,
      editDocument,
    } = this.state;

    return (
      <div className='fade-in' style={{ height: '97vh' }} loading={documents.loading}>
        <Segment fluid style={{ width: '100%', paddingBottom: '3em' }}>
          <section>
            <div className='document-file-header'>
              {(editMode && editDocument) ? (
                <div>
                  <Button.Group floated='right'>
                    <Button icon color='green' size='small' onClick={this.handleTitleEdit}><Icon name='check' /></Button>
                    <Button icon color='grey' size='small' onClick={() => this.setState({ editMode: false, editDocument: false, editDocumentTitle: '' })}><Icon name='close' /></Button>
                  </Button.Group>
                  <Input name='editDocumentTitle' focus onChange={this.handleInputChange} defaultValue={documents.document.title} style={{ width: '100%', marginRight: '1em', border: 0 }} />
                </div>
              ) : (
                <div>
                  {!editMode && <Icon floated='right' name='pencil' title='Edit document title' className='edit-icon-title' onClick={() => this.setState({ editMode: true, editDocument: true, editDocumentTitle: documents.document.title })} /> }
                  <Header as='h2' textAlign='center' style={{ margin: 0 }}>{documents.document.title}</Header>
                </div>
              )}
            </div>
            {documents.document.ingestion_status === 'processing' ? (
              <Message icon size='tiny'>
                <Icon name='circle notched' loading />
                <Message.Content>
                  <Message.Header>Your document is being ingested by the AI</Message.Header>
                </Message.Content>
              </Message>
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '1em', marginTop: '1em' }}>
              <Label title={`Created ${formatDate(documents.document.created_at)}`}><Icon name='calendar' />{formatDate(documents.document.created_at)}</Label>
              <Label title={`Last modified ${formatDate(documents.document.updated_at)}`}><Icon name='calendar' />{formatDate(documents.document.updated_at)}</Label>
              <Label><Icon name='file' />File Size: {Buffer.from(documents.document.content || '').byteLength.toLocaleString()} bytes</Label>
            </div>
            {(documents.document.mime_type === 'text/plain') ? (
              <div id='focused-document' contentEditable={editMode} onInput={this.handleContentChange}>{documents.document.content}</div>
            ) : (['image/png', 'image/gif', 'image/jpeg'].includes(documents.document.mime_type)) ? (
              <div id='focused-document'><img src={`data:${documents.document.mime_type};base64,${Buffer.from(documents.document.content || '').toString('base64')}`} /></div>
            ) : (documents.document.mime_type === 'application/pdf') ? (
              <div id='focused-document'>
                <iframe src={`/blobs/${documents.document.latest_blob_id}`} />
              </div>
            ) : (
              <div id='focused-document'>Unhandled document type <code>{documents.document.mime_type}</code>.</div>
            )}
          </section>
        </Segment>
        <Segment fluid>
          <h3>History</h3>
          <List>
            {documents.document.history && documents.document.history.map((commit, index) => (
              <List.Item key={index}>
                <List.Icon name='history' />
                <List.Content>
                  <List.Header><code>{commit}</code></List.Header>
                </List.Content>
              </List.Item>
            ))}
          </List>
        </Segment>
        <Segment fluid>
          <ChatBox {...this.props} context={{ document: documents.document }} placeholder='Ask about this document...' />
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat (props) {
  const { fabricID } = useParams();
  return <DocumentView fabricID={fabricID} {...props} />;
}

module.exports = Chat;
