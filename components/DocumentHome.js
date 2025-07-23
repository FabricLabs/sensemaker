'use strict';

// Dependencies
const debounce = require('lodash.debounce');
const fetch = require('cross-fetch');

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Card,
  Header,
  Segment,
  List,
  Loader,
  Icon,
  Form,
  Popup,
  Pagination,
  Dropdown,
  Label
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');
const DocumentUploader = require('./DocumentUploader');
const UserProfileSection = require('./UserProfileSection');
const FileUploadModal = require('./FileUploadModal');
const CreateDocumentModal = require('./CreateDocumentModal');

// Functions
const formatDate = require('../functions/formatDate');
const { toast } = require('../functions/toast');

class DocumentHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredDocuments: [], // Initialize filtered documents state
      searching: false, // Boolean to show a spinner icon while fetching
      createModalOpen: false, // Add state for create modal visibility
      createModalType: null, // Add state for create modal type (Document or Folder)
      uploadModalOpen: false, // Add state for upload modal visibility
      settingsPopupOpen: false, // Add state for display settings popup visibility
      currentPage: 1, // Current page for pagination
      itemsPerPage: 12, // Number of documents to display per page
      selectedDocumentType: 'all', // Filter for document type
      itemsPerPageOptions: [
        { key: 12, value: 12, text: '12 per page' },
        { key: 24, value: 24, text: '24 per page' },
        { key: 36, value: 36, text: '36 per page' },
        { key: 48, value: 48, text: '48 per page' },
        { key: 60, value: 60, text: '60 per page' },
        { key: 72, value: 72, text: '72 per page' },
        { key: 84, value: 84, text: '84 per page' },
        { key: 96, value: 96, text: '96 per page' }
      ]
    };
    this.handleSearchChange = debounce((query) => this.performSearch(query), 300);
  }

  componentDidMount () {
    this.props.fetchDocuments();
    this.resetPagination();
  }

  componentDidUpdate (prevProps) {
    const { documents } = this.props;
    if (prevProps.documents != documents) {
      if (!documents.loading && this.state.searching) {
        this.setState({ filtereDocuments: documents.results, searching: false });
      }
      // Reset pagination when documents change (but not during search)
      if (!this.state.searching && !this.state.searchQuery) {
        this.resetPagination();
      }
    }
  }

  handleSearchChange = debounce((query) => {
    // console.debug('search change:', query);
    this.setState({ searching: true, currentPage: 1 }); // Reset to first page when searching
    // TODO: change to `searchDocuments`
    this.props.searchDocument(query);
  }, 1000);

  initiateDocumentCreation = () => {
    this.setState({ createModalOpen: true, createModalType: null });
  }

  initiateFileUpload = () => {
    this.setState({ uploadModalOpen: true });
  }

  initiateFolderCreation = () => {
    this.setState({ createModalOpen: true, createModalType: 'Folder' });
  }

  handleCreateModalClose = () => {
    this.setState({ createModalOpen: false, createModalType: null });
  }

  handleUploadModalClose = () => {
    this.setState({ uploadModalOpen: false });
  }

  handlePaginationChange = (event, { activePage }) => {
    this.setState({ currentPage: activePage });
  }

  resetPagination = () => {
    this.setState({ currentPage: 1 });
  }

  handleItemsPerPageChange = (event, { value }) => {
    this.setState({
      itemsPerPage: value,
      currentPage: 1 // Reset to first page when changing items per page
    });
  }

  handleDocumentTypeChange = (event, { value }) => {
    this.setState({
      selectedDocumentType: value,
      currentPage: 1 // Reset to first page when changing filter
    });
  }

  handleSyncDocuments = async () => {
    try {
      const { documents } = this.props;
      const { store } = this.props;

      if (!store) {
        toast.error('Store not available');
        return;
      }

      if (!documents || !documents.documents) {
        toast.warning('No documents to sync');
        return;
      }

      // Sync all documents to localStorage
      let syncedCount = 0;
      for (const document of documents.documents) {
        try {
          await store.storeDocument(document.fabric_id || document.id, document);
          syncedCount++;
        } catch (error) {
          console.warn('[DOCUMENT_HOME]', 'Failed to sync document:', document.id, error);
        }
      }

      toast.success(`Synced ${syncedCount} documents to local storage`);
    } catch (error) {
      console.error('[DOCUMENT_HOME]', 'Sync failed:', error);
      toast.error('Failed to sync documents: ' + error.message);
    }
  }

  handlePinDocument = async (fabricID, currentPinned) => {
    try {
      const response = await fetch(`/documents/${fabricID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.props.auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinned: !currentPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pin status');
      }

      // Refresh documents list to reflect the change
      this.props.fetchDocuments();

      // Show success message
      toast.success(currentPinned ? 'Document unpinned' : 'Document pinned');
    } catch (error) {
      console.error('Error updating pin status:', error);
      toast.error('Failed to update pin status: ' + error.message);
    }
  }

  render () {
    const { loading, documents } = this.props;
    const {
      filteredDocuments,
      searchQuery,
      searching,
      createModalOpen,
      uploadModalOpen,
      settingsPopupOpen,
      currentPage,
      itemsPerPage,
      selectedDocumentType,
      itemsPerPageOptions,
      createModalType
    } = this.state;

    // Get base documents (search results or all documents)
    const baseDocuments = searchQuery ? filteredDocuments : documents;

    // Apply document type filter
    let displayDocuments = baseDocuments;
    if (baseDocuments && baseDocuments.documents && selectedDocumentType !== 'all') {
      displayDocuments = {
        ...baseDocuments,
        documents: baseDocuments.documents.filter(doc =>
          doc.fabric_type && doc.fabric_type.toLowerCase() === selectedDocumentType.toLowerCase()
        )
      };
    }

    // Get unique document types for filter dropdown
    const documentTypes = baseDocuments && baseDocuments.documents
      ? ['all', ...new Set(baseDocuments.documents
        .map(doc => doc.fabric_type)
        .filter(type => type)
        .map(type => type.toLowerCase())
      )]
      : ['all'];

    const documentTypeOptions = documentTypes.map(type => ({
      key: type,
      value: type,
      text: type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)
    }));

    // Separate pinned and regular documents
    const allDocuments = displayDocuments && displayDocuments.documents ? displayDocuments.documents : [];
    const pinnedDocuments = allDocuments.filter(doc => doc.pinned);
    const regularDocuments = allDocuments.filter(doc => !doc.pinned);

    // Pagination calculations for regular documents only
    const totalDocuments = regularDocuments.length;
    const totalPages = Math.ceil(totalDocuments / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDocuments = regularDocuments.slice(startIndex, endIndex);
    return (
      <fabric-document-home>
        <Segment className='fade-in' fluid style={{ maxHeight: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ marginTop: '0' }}>Library</h1>
            <Button.Group>
              <Button icon color='black' onClick={this.handleSyncDocuments} title='Sync all documents to local storage'>
                <Icon name='sync' />
              </Button>
              <Button icon color='black' onClick={this.initiateFileUpload}>
                <Icon name='upload' />
              </Button>
              <Button icon color='black' onClick={this.initiateFolderCreation}>
                <Icon.Group>
                  <Icon name='folder' />
                  <Icon name='plus' corner='top right' color='green' />
                </Icon.Group>
              </Button>
              <Button icon primary labelPosition='right' onClick={this.initiateDocumentCreation}>
                <span className='desktop-only button-label'>Create Document</span>
                <Icon name='add' />
              </Button>
            </Button.Group>
          </div>
          <p>Search, upload, and manage files.</p>
          {/* <DocumentUploader files={this.props.files} uploadFile={this.props.uploadFile} resetChat={this.props.resetChat} fetchDocuments={this.props.fetchDocuments} navigate={this.props.navigate} /> */}
          <fabric-search fluid placeholder='Find...' className='ui search'>
            <div className='ui huge icon fluid input'>
              <input
                name='query'
                autoComplete='off'
                placeholder='Find...'
                type='text'
                tabIndex='0'
                className='prompt'
                //value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  this.setState({ searchQuery: query });
                  // If query is cleared, reset pagination immediately
                  if (!query.trim()) {
                    this.resetPagination();
                  }
                  this.handleSearchChange(query); // Call the debounce function with the query
                }}
              />
              <i aria-hidden='true' className="search icon"></i>
            </div>
          </fabric-search>

          {/* Document count and page info */}
          {totalDocuments > 0 && !searching && !documents.loading && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1em', marginBottom: '0.5em' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Popup
                  trigger={
                    <Icon
                      name="cog"
                      style={{ cursor: 'pointer', color: '#666' }}
                      title="Display Settings"
                    />
                  }
                  on="click"
                  position="bottom left"
                  wide
                  open={settingsPopupOpen}
                  onOpen={() => this.setState({ settingsPopupOpen: true })}
                  onClose={() => this.setState({ settingsPopupOpen: false })}
                  content={
                    <div style={{ padding: '1em' }}>
                      <Form>
                        <Form.Field>
                          <label>Document Type Filter</label>
                          <Dropdown
                            selection
                            options={documentTypeOptions}
                            value={selectedDocumentType}
                            onChange={this.handleDocumentTypeChange}
                            placeholder="Filter by type"
                            fluid
                          />
                        </Form.Field>
                        <Form.Field>
                          <label>Items Per Page</label>
                          <Dropdown
                            selection
                            options={itemsPerPageOptions}
                            value={itemsPerPage}
                            onChange={this.handleItemsPerPageChange}
                            fluid
                          />
                        </Form.Field>
                      </Form>
                    </div>
                  }
                />
                <span style={{ margin: 0, color: '#666' }}>
                  {allDocuments.length} document{allDocuments.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                  {selectedDocumentType !== 'all' && ` (${selectedDocumentType})`}
                  {pinnedDocuments.length > 0 && ` • ${pinnedDocuments.length} pinned`}
                </span>
              </div>
              {totalPages > 1 && (
                <p style={{ margin: 0, color: '#666' }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, totalDocuments)} of {totalDocuments} regular documents • Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
          )}

          {/* Pinned Documents Section */}
          {pinnedDocuments.length > 0 && (
            <div style={{ marginTop: '1em', marginBottom: '1.5em' }}>
              <Header as='h3' style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                <Icon name='pin' color='yellow' />
                Pinned Documents
              </Header>
              <Card.Group className='pinned-documents-row'>
                {pinnedDocuments.map((instance) => (
                  <Card key={instance.id} className='pinned-document-card' loading={(instance.ingestion_status === 'processing')}>
                    <Card.Content loading={(instance.ingestion_status === 'processing')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5em' }}>
                        <Icon
                          name='pin'
                          color='yellow'
                          size='small'
                          style={{ cursor: 'pointer' }}
                          onClick={() => this.handlePinDocument(instance.fabric_id, instance.pinned)}
                          title='Unpin document'
                        />
                        <Label size='mini' color='yellow'>Pinned</Label>
                      </div>
                      <Popup
                        content={instance.title}
                        trigger={
                          <h3 style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', margin: '0 0 0.5em 0' }}>
                            <Link to={'/documents/' + instance.fabric_id}>{instance.title}</Link>
                          </h3>
                        }
                        position='top left'
                      />
                      <Popup
                        content={['Image', 'Video', 'Audio'].includes(instance.fabric_type) ? instance.mime_type : (instance.summary || instance.description)}
                        trigger={
                          <p style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', margin: 0, fontSize: '0.9em', color: '#666' }}>
                            {['Image', 'Video', 'Audio'].includes(instance.fabric_type) ? instance.mime_type : (instance.summary || instance.description)}
                          </p>
                        }
                        position='bottom left'
                      />
                    </Card.Content>
                    <Button.Group attached='bottom' size='mini' color='black'>
                      <Button as={Link} to={'/documents/' + instance.fabric_id} style={{ textTransform: 'uppercase', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Icon name={
                          instance.fabric_type === 'Image' ? 'image' :
                            instance.fabric_type === 'Video' ? 'video' :
                              instance.fabric_type === 'Audio' ? 'music' :
                                'file'
                        } /> {instance.fabric_type}
                      </Button>
                      <Button as={Link} to={'/documents/' + instance.fabric_id} style={{ maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Icon name='calendar alternate outline' />
                        <abbr className='relative-time' title={instance.created_at}>{instance.created_at}</abbr>
                      </Button>
                    </Button.Group>
                  </Card>
                ))}
              </Card.Group>
            </div>
          )}
          {/* Regular Documents Section */}
          <div>
            {pinnedDocuments.length > 0 && (
              <Header as='h3'>
                All Documents
              </Header>
            )}
            <List as={Card.Group} doubling stackable loading={loading} className='four'>
            {(searching || documents.loading) ? (
              <Loader active inline='centered' /> // Display loading icon if searching is true
            ) : (currentDocuments.length > 0 ? (
              currentDocuments.map((instance) => (
                <List.Item as={Card} key={instance.id} loading={(instance.ingestion_status === 'processing')}>
                  <Card.Content loading={(instance.ingestion_status === 'processing')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5em' }}>
                      <Popup
                        content={instance.title}
                        trigger={
                          <h3 style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', margin: 0, flex: 1 }}>
                            <Link to={'/documents/' + instance.fabric_id}>{instance.title}</Link>
                          </h3>
                        }
                        position='top left'
                      />
                      <Icon
                        name='outline pin'
                        color='grey'
                        size='small'
                        style={{ cursor: 'pointer', marginLeft: '0.5em' }}
                        onClick={() => this.handlePinDocument(instance.fabric_id, instance.pinned)}
                        title='Pin document'
                      />
                    </div>
                    {/* Show mime type for images/videos, otherwise show summary */}
                    <Popup
                      content={['Image', 'Video', 'Audio'].includes(instance.fabric_type) ? instance.mime_type : (instance.summary || instance.description)}
                      trigger={
                        <p style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {['Image', 'Video', 'Audio'].includes(instance.fabric_type) ? instance.mime_type : (instance.summary || instance.description)}
                        </p>
                      }
                      position='bottom left'
                    />
                  </Card.Content>
                  <Button.Group attached='bottom' size='mini' color='black' style={{ marginTop: '1em' }}>
                    <Button as={Link} to={'/documents/' + instance.fabric_id} style={{ textTransform: 'uppercase', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Icon name={
                        instance.fabric_type === 'Image' ? 'image' :
                          instance.fabric_type === 'Video' ? 'video' :
                            instance.fabric_type === 'Audio' ? 'music' :
                              'file'
                      } /> {instance.fabric_type}
                    </Button>
                    <Button as={Link} to={'/documents/' + instance.fabric_id} style={{ maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Icon name='calendar alternate outline' /> <abbr className='relative-time' title={instance.created_at}>{instance.created_at}</abbr></Button>
                  </Button.Group>
                </List.Item>
              ))) : (
              <Segment placeholder textAlign="center" style={{ marginLeft: '1em' }}>
                <Header icon>
                  <Icon name='file outline' />
                  No Documents Found
                </Header>
                <Segment.Inline>
                  <p>You haven't uploaded any documents yet!</p>
                </Segment.Inline>
              </Segment>
            )
            )}
          </List>
          {/* Pagination Controls */}
          {totalPages > 1 && !searching && !documents.loading && (
            <div style={{
              width: '100%',
              marginTop: '1em',
              marginBottom: '1em'
            }}>
              <style>
                {`
                  .full-width-pagination.ui.pagination.menu {
                    width: 100% !important;
                    display: flex !important;
                  }
                  .full-width-pagination.ui.pagination.menu .item:last-child {
                    margin-left: auto !important;
                  }
                `}
              </style>
              <Pagination
                className="full-width-pagination"
                activePage={currentPage}
                totalPages={totalPages}
                onPageChange={this.handlePaginationChange}
                boundaryRange={totalPages <= 10 ? totalPages : 2}
                siblingRange={totalPages <= 15 ? totalPages : 3}
                showEllipsis={totalPages > 15}
                showFirstAndLastNav={true}
                showPreviousAndNextNav={true}
                firstItem={{
                  'aria-label': 'First item',
                  content: '«',
                  disabled: currentPage === 1
                }}
                prevItem={{
                  'aria-label': 'Previous item',
                  content: '‹',
                  disabled: currentPage === 1
                }}
                nextItem={{
                  'aria-label': 'Next item',
                  content: '›',
                  disabled: currentPage === totalPages
                }}
                lastItem={{
                  'aria-label': 'Last item',
                  content: '»',
                  disabled: currentPage === totalPages
                }}
              />
            </div>
          )}
          {(allDocuments.length > 0 ? (
            <ChatBox
              {...this.props}
              messagesEndRef={this.messagesEndRef}
              includeFeed={false}
              placeholder={'Ask about these documents...'}
              context={{ documents: { ...displayDocuments, documents: allDocuments } }}
              resetInformationSidebar={this.props.resetInformationSidebar}
              messageInfo={this.props.messageInfo}
              thumbsUp={this.props.thumbsUp}
              thumbsDown={this.props.thumbsDown}
            />
          ) : null)}
          </div>
        </Segment>
        <CreateDocumentModal
          open={createModalOpen}
          onClose={this.handleCreateModalClose}
          token={this.props.token}
          navigate={this.props.navigate}
          defaultType={createModalType}
        />
        <FileUploadModal
          open={uploadModalOpen}
          onClose={this.handleUploadModalClose}
          uploadFile={this.props.uploadFile}
          navigate={this.props.navigate}
          token={this.props.token}
        />

      </fabric-document-home>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DocumentHome;
