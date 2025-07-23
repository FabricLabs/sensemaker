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
  List,
  Loader,
  Confirm,
  Dropdown
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');
const GraphContent = require('./GraphContent');
const MarkdownContent = require('./MarkdownContent');
const HTMLContent = require('./HTMLContent');
const ListContent = require('./ListContent');
const FolderContent = require('./FolderContent');
const TextContent = require('./TextContent');
const BinaryContent = require('./BinaryContent');
const AudioContent = require('./AudioContent');
const VideoContent = require('./VideoContent');
const ImageContent = require('./ImageContent');
const CreateDocumentModal = require('./CreateDocumentModal');
const FileUploadModal = require('./FileUploadModal');

// Functions
const formatDate = require('../functions/formatDate');
const truncateMiddle = require('../functions/truncateMiddle');
const toRelativeTime = require('../functions/toRelativeTime');
const { toast } = require('../functions/toast');

class DocumentView extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      editDocument: false,
      editDocumentTitle: '',
      creationError: false,
      historyModalOpen: false,
      selectedRevision: null,
      contentEditMode: false,
      editError: null,
      confirmDelete: false,
      folders: [],
      addToFolderLoading: false,
      addToFolderOpen: false,
      createModalOpen: false,
      uploadModalOpen: false,
      currentFolder: null,
      containingFolders: [] // Track all folders that contain this document
    };

    this.loadFolders = this.loadFolders.bind(this);
    this.handleAddToFolder = this.handleAddToFolder.bind(this);
    this.handleCreateModalOpen = this.handleCreateModalOpen.bind(this);
    this.handleCreateModalClose = this.handleCreateModalClose.bind(this);
    this.handleTogglePin = this.handleTogglePin.bind(this);

    return this;
  }

  componentDidMount () {
    const { fabricID } = this.props;
    this.props.fetchDocument(fabricID);
  }

  componentDidUpdate (prevProps) {
    const { documents, folderContext } = this.props;
    if (prevProps.fabricID !== this.props.fabricID) {
      this.props.fetchDocument(this.props.fabricID);
    }

    if (prevProps.documents != documents) {
      console.log('[SENSEMAKER]', 'Document:', this.props.documents.document);

      // Load folders when document loads initially
      if (documents.document && documents.document.id &&
          (!prevProps.documents.document || prevProps.documents.document.id !== documents.document.id)) {
        this.loadFolders();
      }
    }

    // Reload folders if folder context changed
    if (folderContext !== prevProps.folderContext) {
      this.loadFolders();
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
    // Fetch the commit data if we don't already have it
    if (!this.props.documents.commits[revision]) {
      const { fabricID } = this.props;
      this.props.fetchCommit(fabricID, revision);
    }
  };

  handleHistoryModalClose = () => {
    this.setState({ historyModalOpen: false, selectedRevision: null });
  };

  handleEditModeToggle = (newMode) => {
    if (newMode !== undefined) {
      // Called from content components with specific mode
      this.setState({ contentEditMode: newMode });
    } else {
      // Called from our button, toggle the current state
      this.setState(prev => ({ contentEditMode: !prev.contentEditMode }));
    }
  };

  handleDismissError = () => {
    this.setState({ editError: null });
  };

  handleRestoreCommit = (commit) => {
    const { document } = this.props.documents;

    // Restore the document to the state in this commit
    const restoreData = {
      title: commit.content.title,
      content: commit.content.content,
      fabric_type: commit.content.fabric_type,
      mime_type: commit.content.mime_type
    };

    this.props.editDocument(document.id, restoreData);

    // Close the history modal after restore
    this.setState({ historyModalOpen: false, selectedRevision: null });
  };

  handleDeleteConfirm = () => {
    this.setState({ confirmDelete: true });
  };

  handleDeleteCancel = () => {
    this.setState({ confirmDelete: false });
  };

  handleDelete = async () => {
    const { document } = this.props.documents;
    try {
      await this.props.deleteDocument(document.id);
      // Navigate back to documents list after successful deletion
      this.props.navigate('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      // You could add error handling here, maybe show a toast or message
    }
    this.setState({ confirmDelete: false });
  };

  async loadFolders () {
    this.setState({ addToFolderLoading: true });

    try {
      const response = await fetch('/documents?filter={"type":"Folder"}', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.auth?.token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const result = await response.json();

      // Handle standard GET response format
      let folders = [];
      if (Array.isArray(result)) {
        folders = result.filter(doc => doc && doc.fabric_type === 'Folder');
      } else if (result.documents && Array.isArray(result.documents)) {
        folders = result.documents.filter(doc => doc && doc.fabric_type === 'Folder');
      } else if (result.data && Array.isArray(result.data)) {
        folders = result.data.filter(doc => doc && doc.fabric_type === 'Folder');
      } else {
        console.warn('Unexpected API response format:', result);
        folders = [];
      }

            // Load current folder info if we have folder context
      let currentFolder = null;
      if (this.props.folderContext) {
        try {
          const folderResponse = await fetch(`/documents/${this.props.folderContext}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer ' + this.props.auth?.token
            }
          });

          if (folderResponse.ok) {
            currentFolder = await folderResponse.json();
          }
        } catch (error) {
          console.warn('Failed to load current folder:', error);
        }
      }

      this.setState({
        folders,
        currentFolder,
        addToFolderLoading: false
      });
    } catch (error) {
      console.error('Failed to load folders:', error);
      this.setState({ folders: [], currentFolder: null, addToFolderLoading: false });
    }
  }

  async handleAddToFolder (folderId) {
    const { document } = this.props.documents;

    try {
      // Fetch the current folder content
      const folderResponse = await fetch(`/documents/${folderId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.auth?.token
        }
      });

      if (!folderResponse.ok) {
        throw new Error('Failed to fetch folder');
      }

      const folder = await folderResponse.json();
      let folderItems = [];

      try {
        folderItems = JSON.parse(folder.content || '[]');
        if (!Array.isArray(folderItems)) folderItems = [];
      } catch (error) {
        console.warn('Failed to parse folder content:', error);
        folderItems = [];
      }

      // Check if document is already in folder
      if (folderItems.includes(document.id)) {
        toast.warning('Document is already in this folder');
        return;
      }

      // Add document to folder
      const updatedItems = [...folderItems, document.id];

      // Update folder content
      const updateResponse = await fetch(`/documents/${folderId}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.auth?.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: JSON.stringify(updatedItems)
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update folder');
      }

      // Show success message
      toast.success(`Document added to folder "${folder.title}"`);
      this.setState({ addToFolderOpen: false });

      // Refresh the folders to update current folder status
      this.loadFolders();

    } catch (error) {
      console.error('Failed to add document to folder:', error);
      toast.error('Failed to add document to folder: ' + error.message);
    }
  }

  handleCreateModalOpen () {
    this.setState({ createModalOpen: true });
  }

  handleCreateModalClose () {
    this.setState({ createModalOpen: false });
  }

  handleCreateModalSuccess = async (newDocument) => {
    // If we're viewing a document (not a folder), add the newly created folder to the current document
    const { document } = this.props.documents;
    if (document && document.fabric_type !== 'Folder' && newDocument && newDocument.fabric_type === 'Folder') {
      try {
        // Add the new folder to the current document's folder list
        await this.handleAddToFolder(newDocument['@id'] || newDocument.id);
        console.log('Newly created folder added to current document');
      } catch (error) {
        console.error('Failed to add newly created folder to current document:', error);
        // Don't show error to user as the folder was still created successfully
      }
    }
  }

  handleUploadModalOpen = () => {
    this.setState({ uploadModalOpen: true });
  }

  handleUploadModalClose = () => {
    this.setState({ uploadModalOpen: false });
  }

  handleFolderUpload = async (file) => {
    // Use the original upload function
    const uploadResult = await this.props.uploadFile(file);

    // If we're viewing a folder, automatically add the uploaded document to it
    const { document } = this.props.documents;
    if (document && document.fabric_type === 'Folder') {
      try {
        // Get the current folder items
        const folderItems = JSON.parse(document.content || '[]');

        // Add the new document ID (using fabric_id from upload result)
        const documentId = uploadResult.fabric_id || uploadResult.id;
        if (documentId && !folderItems.includes(documentId)) {
          const updatedItems = [...folderItems, documentId];

          // Update the folder content
          await fetch(`/documents/${document.id}`, {
            method: 'PATCH',
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer ' + this.props.auth?.token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: JSON.stringify(updatedItems)
            })
          });

          // Refresh the document to show the updated folder content
          this.props.fetchDocument(this.props.fabricID);
        }
      } catch (error) {
        console.warn('Failed to add uploaded document to folder:', error);
        // Don't fail the upload if folder addition fails
      }
    }

    return uploadResult;
  }

  async handleTogglePin () {
    const { document } = this.props.documents;
    const newPinnedState = !document.pinned;

    try {
      const response = await fetch(`/documents/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.auth?.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pinned: newPinnedState
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update pin status');
      }

      // Update the document in state
      this.props.editDocument(document.id, { pinned: newPinnedState });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('Failed to update pin status: ' + error.message);
    }
  }

  handleSyncDocument = async () => {
    try {
      const { document } = this.props.documents;
      const { store } = this.props;

      if (!store) {
        toast.error('Store not available');
        return;
      }

      if (!document) {
        toast.warning('No document to sync');
        return;
      }

      // Sync current document to localStorage
      await store.storeDocument(document.fabric_id || document.id, document);

      toast.success(`Document "${document.title}" synced to local storage`);
    } catch (error) {
      console.error('[DOCUMENT_VIEW]', 'Sync failed:', error);
      toast.error('Failed to sync document: ' + error.message);
    }
  }

  render () {
    const { documents } = this.props;
    const { editDocument } = this.state;
    return (
      <div className='fade-in' style={{ height: '97vh' }} loading={documents.loading}>
        <Card fluid>
          <Card.Content extra>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Label title='Document Type' style={{ textTransform: 'uppercase' }}>
                  <Icon name='file' />
                  {documents.document.fabric_type}
                </Label>&nbsp;
                <span style={{ textTransform: 'uppercase' }}>{documents.document.title}</span>&nbsp;
                (<abbr title={this.state.saving ? 'Document is being saved...' : `Last modified ${formatDate(documents.document.updated_at)}`}>
                  {this.state.saving ? 'Saving...' : toRelativeTime(documents.document.updated_at)}
                </abbr>)
              </div>
              <Button.Group size='mini'>
                <Button
                  icon
                  color='black'
                  onClick={this.handleSyncDocument}
                  className='responsive-button'
                  title='Sync document to local storage'
                >
                  <Icon name='sync' />
                </Button>
                <Button
                    icon
                    color='black'
                    onClick={this.handleDeleteConfirm}
                    className='responsive-button'
                  >
                  <Icon name='trash' />
                </Button>
                {(['Text', 'Markdown', 'HTML', 'List', 'Folder', 'Graph'].includes(documents.document.fabric_type)) && (
                  <Button
                    icon
                    color='black'
                    onClick={() => this.handleEditModeToggle()}
                    className='responsive-button'
                  >
                    <Icon name='edit' />
                    <span className='desktop-only button-label'>{this.state.contentEditMode ? 'View' : 'Edit'}</span>
                  </Button>
                )}
                {documents.document.fabric_type === 'Folder' && (
                  <>
                    <Button
                      icon
                      color='black'
                      onClick={this.handleUploadModalOpen}
                      className='responsive-button'
                    >
                      <Icon name='upload' />
                    </Button>
                    <Button
                      icon
                      color='primary'
                      onClick={this.handleCreateModalOpen}
                      className='responsive-button'
                    >
                      <Icon name='plus' />
                    </Button>
                  </>
                )}
                {documents.document.fabric_type !== 'Folder' && (
                  <Dropdown
                    button
                    color='black'
                    className='icon responsive-dropdown'
                    labeled
                    icon={this.state.currentFolder ? 'folder open' : 'folder plus'}
                    text={
                      <span className='desktop-only'>
                        {this.state.currentFolder
                          ? `${this.state.currentFolder.title || 'Folder'}`
                          : 'Add to Folder'
                        }
                      </span>
                    }
                    loading={this.state.addToFolderLoading}
                    onOpen={() => {
                      this.setState({ addToFolderOpen: true });
                      this.loadFolders();
                    }}
                    onClose={() => this.setState({ addToFolderOpen: false })}
                    open={this.state.addToFolderOpen}
                  >
                    <Dropdown.Menu>
                      {this.state.currentFolder && (
                        <>
                          <Dropdown.Header>Currently in folder:</Dropdown.Header>
                          <Dropdown.Item
                            text={this.state.currentFolder.title || `Folder ${this.state.currentFolder.id}`}
                            icon='folder open'
                            disabled
                          />
                          <Dropdown.Divider />
                        </>
                      )}
                      {this.state.folders.length === 0 ? (
                        <Dropdown.Item disabled text='No folders available' />
                      ) : (
                        <>
                          {this.state.currentFolder && (
                            <Dropdown.Header>Add to other folders:</Dropdown.Header>
                          )}
                          {this.state.folders
                            .filter(folder => !this.state.currentFolder || folder.fabric_id !== this.state.currentFolder.id)
                            .map(folder => (
                              <Dropdown.Item
                                key={folder.fabric_id}
                                text={folder.title || `Folder ${folder.fabric_id}`}
                                icon='folder'
                                onClick={() => this.handleAddToFolder(folder.fabric_id)}
                              />
                            ))
                          }
                        </>
                      )}
                      <Dropdown.Divider />
                      <Dropdown.Item
                        text='Create New Folder'
                        icon='plus'
                        onClick={() => {
                          this.setState({
                            addToFolderOpen: false,
                            createModalOpen: true
                          });
                        }}
                      />
                    </Dropdown.Menu>
                  </Dropdown>
                )}
                <Button
                  icon
                  color={documents.document.pinned ? 'yellow' : 'primary'}
                  onClick={this.handleTogglePin}
                  title={documents.document.pinned ? 'Unpin document' : 'Pin document'}
                  labelPosition='right'
                  className='responsive-button'
                >
                  <Icon name={documents.document.pinned ? 'pin' : 'pin'} />
                  <span className='desktop-only button-label'>{documents.document.pinned ? 'Unpin' : 'Pin'}</span>
                </Button>
              </Button.Group>
            </div>
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
              {(documents.document.fabric_type === 'Markdown') ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <MarkdownContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    onContentChange={this.handleContentChange}
                    editable={true}
                    hideEditButton={true}
                    externalEditMode={this.state.contentEditMode}
                    onEditModeChange={this.handleEditModeToggle}
                    token={this.props.auth?.token}
                  />
                </div>
              ) : (documents.document.fabric_type === 'HTML' || documents.document.mime_type === 'text/html') ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <HTMLContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    onContentChange={this.handleContentChange}
                    editable={true}
                    hideEditButton={true}
                    externalEditMode={this.state.contentEditMode}
                    onEditModeChange={this.handleEditModeToggle}
                    token={this.props.auth?.token}
                  />
                </div>
              ) : (documents.document.fabric_type === 'List') ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <ListContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    onContentChange={this.handleContentChange}
                    editable={true}
                    hideEditButton={true}
                    externalEditMode={this.state.contentEditMode}
                    onEditModeChange={this.handleEditModeToggle}
                    token={this.props.auth?.token}
                  />
                </div>
              ) : (documents.document.fabric_type === 'Folder') ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <FolderContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    onContentChange={this.handleContentChange}
                    editable={true}
                    hideEditButton={true}
                    externalEditMode={this.state.contentEditMode}
                    onEditModeChange={this.handleEditModeToggle}
                    token={this.props.auth?.token}
                    folderId={documents.document.id}
                  />
                </div>
              ) : (documents.document.fabric_type === 'Graph') ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <GraphContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    onContentChange={this.handleContentChange}
                    editable={true}
                    hideEditButton={true}
                    externalEditMode={this.state.contentEditMode}
                    onEditModeChange={this.handleEditModeToggle}
                  />
                </div>
              ) : (documents.document.fabric_type === 'Image' || ['image/png', 'image/gif', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'].includes(documents.document.mime_type)) ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <ImageContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    latest_blob_id={documents.document.latest_blob_id}
                    mime_type={documents.document.mime_type}
                  />
                </div>
              ) : (documents.document.mime_type === 'application/pdf') ? (
                <div id='focused-document'>
                  <iframe src={`/blobs/${documents.document.latest_blob_id}`} style={{ width: '100%', height: '600px', border: 'none' }} />
                </div>
              ) : (documents.document.mime_type && documents.document.mime_type.startsWith('audio/')) ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <AudioContent
                    key={`document-${documents.document.id}`}
                    title={documents.document.title}
                    mime_type={documents.document.mime_type}
                    latest_blob_id={documents.document.latest_blob_id}
                  />
                </div>
              ) : (documents.document.fabric_type === 'Video' || (documents.document.mime_type && documents.document.mime_type.startsWith('video/'))) ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <VideoContent
                    key={`document-${documents.document.id}`}
                    title={documents.document.title}
                    mime_type={documents.document.mime_type}
                    latest_blob_id={documents.document.latest_blob_id}
                  />
                </div>
              ) : (documents.document.fabric_type === 'File' ||
                ['application/octet-stream', 'application/x-binary'].includes(documents.document.mime_type) ||
                (documents.document.mime_type && !documents.document.mime_type.startsWith('text/') && !documents.document.mime_type.startsWith('image/') && !documents.document.mime_type.startsWith('audio/') && !documents.document.mime_type.startsWith('video/'))) ? (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <BinaryContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    latest_blob_id={documents.document.latest_blob_id}
                  />
                </div>
              ) : (
                <div className='document-content-transition' style={{ width: '100%', marginTop: '1em' }}>
                  <TextContent
                    key={`document-${documents.document.id}`}
                    content={documents.document.content}
                    onContentChange={this.handleContentChange}
                    editable={true}
                    hideEditButton={true}
                    externalEditMode={this.state.contentEditMode}
                    onEditModeChange={this.handleEditModeToggle}
                    error={this.state.editError}
                    token={this.props.auth?.token}
                  />
                </div>
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
                  <Segment basic loading={documents.loadingCommit}>
                    <Header as='h3'>Revision: {truncateMiddle(this.state.selectedRevision, 11)}</Header>
                    {documents.commitError ? (
                      <Message negative>
                        <Message.Header>Error Loading Commit</Message.Header>
                        <p>{documents.commitError}</p>
                      </Message>
                    ) : documents.selectedCommit && documents.selectedCommit.id === this.state.selectedRevision ? (
                      <div>
                        <div style={{ marginBottom: '1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Label>
                              <Icon name='clock' />
                              {new Date(documents.selectedCommit.timestamp).toLocaleString()}
                            </Label>
                            {documents.selectedCommit.parent && (
                              <Label>
                                <Icon name='code branch' />
                                Parent: {truncateMiddle(documents.selectedCommit.parent, 8)}
                              </Label>
                            )}
                          </div>
                          <Button
                            color='blue'
                            size='small'
                            onClick={() => this.handleRestoreCommit(documents.selectedCommit)}
                            disabled={documents.editing}
                          >
                            <Icon name='undo' />
                            Restore to This Version
                          </Button>
                        </div>
                        <Header as='h4'>Document State at This Revision:</Header>
                        <div style={{ background: '#f8f8f8', padding: '1em', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                          <div><strong>Title:</strong> {documents.selectedCommit.content.title}</div>
                          <div><strong>Type:</strong> {documents.selectedCommit.content.fabric_type}</div>
                          <div><strong>MIME Type:</strong> {documents.selectedCommit.content.mime_type}</div>
                          <div style={{ marginTop: '1em' }}>
                            <strong>Content:</strong>
                            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5em', fontSize: '0.9em' }}>
                              {documents.selectedCommit.content.content || '(No content)'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Message info>
                        <Message.Header>Loading Revision</Message.Header>
                        <p>Fetching revision details...</p>
                      </Message>
                    )}
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
        <Confirm
          open={this.state.confirmDelete}
          header='Delete Document'
          content={`Are you sure you want to delete "${documents.document.title}"? This action cannot be undone.`}
          confirmButton={{ content: 'Delete', color: 'red' }}
          cancelButton='Cancel'
          onConfirm={this.handleDelete}
          onCancel={this.handleDeleteCancel}
        />
        <CreateDocumentModal
          open={this.state.createModalOpen}
          onClose={this.handleCreateModalClose}
          onSuccess={this.handleCreateModalSuccess}
          token={this.props.auth?.token}
          navigate={this.props.navigate}
          folderId={documents.document.fabric_type === 'Folder' ? documents.document.id : null}
          folderTitle={documents.document.fabric_type === 'Folder' ? documents.document.title : null}
          defaultType="Folder"
        />
        <FileUploadModal
          open={this.state.uploadModalOpen}
          onClose={this.handleUploadModalClose}
          uploadFile={this.handleFolderUpload}
          navigate={this.props.navigate}
          token={this.props.auth?.token}
        />
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

function Document (props) {
  const { fabricID } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const folderContext = urlParams.get('folder');
  return <DocumentView fabricID={fabricID} folderContext={folderContext} {...props} />;
}

module.exports = Document;
