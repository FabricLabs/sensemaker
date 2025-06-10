'use strict';

// Dependencies
const debounce = require('lodash.debounce');
const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

// Semantic UI
const {
  Card,
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

// Local Components
const MarkdownContent = require('./MarkdownContent');
const ChatBox = require('./ChatBox');

// Functions
const formatDate = require('../functions/formatDate');
const truncateMiddle = require('../functions/truncateMiddle');
const toRelativeTime = require('../functions/toRelativeTime');

class DocumentView extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      editDocument: false,
      editDocumentTitle: '',
      creationError: false,
      historyModalOpen: false,
      selectedRevision: null,
      markdownEditMode: false,
      editError: null
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

    // Handle edit errors
    if (documents.error && documents.error !== prevProps.documents.error) {
      this.setState({ editError: documents.error });
    }

    // Clear error when edit succeeds
    if (documents.editionSuccess && !prevProps.documents.editionSuccess) {
      this.setState({ editError: null });
    }
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleContentChange = (newContent) => {
    const { document } = this.props.documents;
    // Ensure content is always a string
    const contentString = typeof newContent === 'string' ? newContent : String(newContent);
    this.props.editDocument(document.id, { content: contentString });
  };

  handleTitleEdit = () => {
    const { document } = this.props.documents;
    const { editDocumentTitle } = this.state;
    this.props.editDocument(document.id, { title: editDocumentTitle });
    this.setState({ editDocument: false, editDocumentTitle: '' });
  }

  handleRevisionSelect = (revision) => {
    this.setState({ selectedRevision: revision });
  };

  handleHistoryModalClose = () => {
    this.setState({ historyModalOpen: false, selectedRevision: null });
  };

  handleMarkdownToggle = (newMode) => {
    if (newMode !== undefined) {
      // Called from MarkdownContent with specific mode
      this.setState({ markdownEditMode: newMode });
    } else {
      // Called from our button, toggle the current state
      this.setState(prev => ({ markdownEditMode: !prev.markdownEditMode }));
    }
  };

  handleDismissError = () => {
    this.setState({ editError: null });
  };

  render () {
    const { documents } = this.props;
    const { editDocument } = this.state;

    return (
      <div className='fade-in' style={{ height: '97vh' }} loading={documents.loading}>
        <Card fluid>
          <Card.Content extra>
            <span>
              <Icon name='file' />
              <span style={{ textTransform: 'uppercase' }}>{documents.document.title}</span>
            </span>&nbsp;(<abbr title={`Last modified ${formatDate(documents.document.updated_at)}`}>{toRelativeTime(documents.document.updated_at)}</abbr>)
          </Card.Content>
          <Card.Content>
            <section>
              <div className='document-file-header'>
                {editDocument ? (
                  <div>
                    <Input
                      name='editDocumentTitle'
                      focus
                      onChange={this.handleInputChange}
                      defaultValue={documents.document.title}
                      style={{ width: 'calc(100% - 90px)' }}
                      action={
                        <Button.Group attached='right'>
                          <Button icon color='green' onClick={this.handleTitleEdit}><Icon name='check' /></Button>
                          <Button icon color='grey' onClick={() => this.setState({ editDocument: false, editDocumentTitle: '' })}><Icon name='close' /></Button>
                        </Button.Group>
                      }
                    />
                  </div>
                ) : (
                  <div>
                    {documents.document.mime_type === 'text/plain' && (
                      <Button
                        icon
                        labelPosition='left'
                        size='small'
                        onClick={() => this.handleMarkdownToggle()}
                        style={{ float: 'right', marginTop: '0.2em' }}
                      >
                        <Icon name='edit' />
                        {this.state.markdownEditMode ? 'View' : 'Edit'}
                      </Button>
                    )}
                    <Header as='h2' style={{ margin: 0, display: 'inline-block' }}>
                      <span>{documents.document.title}</span>
                    </Header>
                    <Icon
                      name='pencil'
                      title='Edit document title'
                      className='edit-icon-title'
                      onClick={() => this.setState({ editDocument: true, editDocumentTitle: documents.document.title })}
                      style={{ marginLeft: '0.5em', cursor: 'pointer' }}
                    />
                  </div>
                )}
                <p>{documents.document.summary}</p>
              </div>
              {documents.document.ingestion_status === 'processing' ? (
                <Message icon size='tiny'>
                  <Icon name='circle notched' loading />
                  <Message.Content>
                    <Message.Header>Your document is being ingested by the AI</Message.Header>
                  </Message.Content>
                </Message>
              ) : null}
              {this.state.editError && (
                <Message negative size='small' onDismiss={this.handleDismissError}>
                  <Icon name='warning sign' />
                  <Message.Content>
                    <Message.Header>Document Edit Error</Message.Header>
                    <p>{this.state.editError.content || this.state.editError.message || 'An error occurred while editing the document.'}</p>
                  </Message.Content>
                </Message>
              )}
              {(documents.document.mime_type === 'text/plain') ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <MarkdownContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    onContentChange={this.handleContentChange}
                    editable={true}
                    hideEditButton={true}
                    externalEditMode={this.state.markdownEditMode}
                    onEditModeChange={this.handleMarkdownToggle}
                  />
                </div>
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
          </Card.Content>
          <Card.Content extra>
            {documents.document.history && documents.document.history[0] && (
              <Label onClick={() => this.setState({ historyModalOpen: true })} style={{ cursor: 'pointer', display: 'inline-block' }}>
                <Icon name='history' />
                <code>{truncateMiddle(documents.document.history[0], 11)}</code>
              </Label>
            )}
            <Label title={`Created ${formatDate(documents.document.created_at)}`}><Icon name='calendar' />{formatDate(documents.document.created_at)}</Label>
            <Label><Icon name='file' />File Size: {Buffer.from(documents.document.content || '').byteLength.toLocaleString()} bytes</Label>
          </Card.Content>
        </Card>

        <Modal
          open={this.state.historyModalOpen}
          onClose={this.handleHistoryModalClose}
          size='large'
        >
          <Modal.Header>Document History</Modal.Header>
          <Modal.Content>
            <div style={{ display: 'flex', height: '70vh' }}>
              <div style={{ width: '30%', borderRight: '1px solid #ddd', padding: '1em', overflowY: 'auto' }}>
                <List selection>
                  {documents.document.history && documents.document.history.map((commit, index) => (
                    <List.Item
                      key={index}
                      active={this.state.selectedRevision === commit}
                      onClick={() => this.handleRevisionSelect(commit)}
                    >
                      <List.Icon name='history' />
                      <List.Content>
                        <List.Header>
                          <code>{truncateMiddle(commit, 11)}</code>
                        </List.Header>
                      </List.Content>
                    </List.Item>
                  ))}
                </List>
              </div>
              <div style={{ width: '70%', padding: '1em', overflowY: 'auto' }}>
                {this.state.selectedRevision ? (
                  <Segment basic loading={!this.state.selectedRevision}>
                    <Header as='h3'>Preview of revision: {truncateMiddle(this.state.selectedRevision, 11)}</Header>
                    {/* TODO: Add actual revision preview once the backend supports it */}
                    <Message info>
                      <Message.Header>Revision Preview</Message.Header>
                      <p>The preview functionality will be available once the backend supports retrieving historical versions.</p>
                    </Message>
                  </Segment>
                ) : (
                  <Message>
                    <Message.Header>Select a revision</Message.Header>
                    <p>Choose a revision from the list on the left to preview its contents.</p>
                  </Message>
                )}
              </div>
            </div>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.handleHistoryModalClose}>Close</Button>
          </Modal.Actions>
        </Modal>
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
