'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Icon,
  Input,
  List,
  Dropdown,
  Label,
  Message,
  ButtonGroup,
  Popup
} = require('semantic-ui-react');

const ListContent = require('./ListContent');

class FolderContent extends ListContent {
  constructor (props = {}) {
    super(props);

    // Override state for folder-specific functionality
    this.state = {
      ...this.state,
      documentSearchQuery: '',
      searchResults: [],
      isSearching: false,
      documentCache: {}, // Cache document metadata
      hoveredResult: null // Track which search result is hovered
    };

    this.handleDocumentSearch = this.handleDocumentSearch.bind(this);
    this.handleAddDocument = this.handleAddDocument.bind(this);
    this.fetchDocumentMetadata = this.fetchDocumentMetadata.bind(this);

    return this;
  }

  componentDidMount () {
    super.componentDidMount();
    // Load metadata for existing document IDs in the folder
    this.loadExistingDocuments();
  }

  componentDidUpdate (prevProps) {
    super.componentDidUpdate(prevProps);
    // Reload document metadata if items changed
    if (prevProps.content !== this.props.content) {
      this.loadExistingDocuments();
    }
  }

  async loadExistingDocuments () {
    const { currentItems } = this.state;
    if (!currentItems.length) return;
    // Fetch metadata for all document IDs that aren't cached
    const uncachedIds = currentItems.filter(id => !this.state.documentCache[id]);
    if (uncachedIds.length === 0) return;

    try {
      const promises = uncachedIds.map(id => this.fetchDocumentMetadata(id));
      const results = await Promise.allSettled(promises);

      const newCache = { ...this.state.documentCache };
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          newCache[uncachedIds[index]] = result.value;
        }
      });

      this.setState({ documentCache: newCache });
    } catch (error) {
      console.error('Failed to load document metadata:', error);
    }
  }

  async fetchDocumentMetadata (documentId) {
    try {
      const response = await fetch(`/documents/${documentId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.token
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document ${documentId}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch metadata for document ${documentId}:`, error);
      return null;
    }
  }

  async handleDocumentSearch (query) {
    if (!query || query.length < 2) {
      this.setState({ searchResults: [], isSearching: false });
      return;
    }

    this.setState({ isSearching: true, documentSearchQuery: query });

    try {
      const response = await fetch(`/documents`, {
        method: 'SEARCH',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search documents');
      }

            const results = await response.json();
      
      // Handle canonical search API response format
      let documents = [];
      if (results.content && results.content.documents && Array.isArray(results.content.documents)) {
        // Extract document objects from content.documents[].object
        documents = results.content.documents.map(item => item.object).filter(Boolean);
      } else if (results.results && Array.isArray(results.results)) {
        // Extract document objects from results[].object
        documents = results.results.map(item => item.object).filter(Boolean);
      } else if (Array.isArray(results)) {
        documents = results;
      } else if (results.documents && Array.isArray(results.documents)) {
        documents = results.documents;
      } else if (results.data && Array.isArray(results.data)) {
        documents = results.data;
      } else {
        console.warn('Unexpected API response format:', results);
        documents = [];
      }
      
      // Filter out documents already in the folder
      const filteredResults = documents.filter(doc => 
        doc && doc.id && !this.state.currentItems.includes(doc.id)
      );

      this.setState({ 
        searchResults: filteredResults.slice(0, 10),
        isSearching: false 
      });
    } catch (error) {
      console.error('Document search failed:', error);
      this.setState({
        searchResults: [],
        isSearching: false,
        error: { message: 'Failed to search documents: ' + error.message }
      });
    }
  }

  handleAddDocument = async (documentId) => {
    if (this.state.currentItems.includes(documentId)) return;
    // Fetch document metadata and cache it
    const metadata = await this.fetchDocumentMetadata(documentId);
    if (metadata) {
      this.setState(prev => ({
        documentCache: { ...prev.documentCache, [documentId]: metadata }
      }));
    }

    // Add document ID to the folder and clear search
    this.setState(prev => ({
      contentHistory: [...prev.contentHistory, [...prev.currentItems]],
      currentItems: [...prev.currentItems, documentId],
      documentSearchQuery: '',
      searchResults: []
    }), () => {
      this.handleContentChange();
    });
  };

  generateStatistics () {
    const { currentItems, documentCache } = this.state;
    const stats = {
      totalDocuments: currentItems.length,
      documentTypes: {},
      pinnedCount: 0,
      totalSize: 0,
      lastModified: null,
      loadedDocuments: 0
    };

    currentItems.forEach(documentId => {
      const doc = documentCache[documentId];
      if (doc) {
        stats.loadedDocuments++;
        
        // Count document types
        const type = doc.fabric_type || 'Unknown';
        stats.documentTypes[type] = (stats.documentTypes[type] || 0) + 1;
        
        // Count pinned documents
        if (doc.pinned) {
          stats.pinnedCount++;
        }
        
        // Track latest modification
        if (doc.updated_at || doc.created_at) {
          const modDate = new Date(doc.updated_at || doc.created_at);
          if (!stats.lastModified || modDate > stats.lastModified) {
            stats.lastModified = modDate;
          }
        }
        
        // Add file size if available
        if (doc.file_size) {
          stats.totalSize += parseInt(doc.file_size) || 0;
        }
      }
    });

    return stats;
  };

  formatFileSize (bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  renderStatistics () {
    const stats = this.generateStatistics();
    const { currentItems } = this.state;
    
    if (currentItems.length === 0) return null;

    return (
      <div style={{ 
        marginTop: '2em', 
        padding: '1em', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '1em', color: '#495057' }}>
          <Icon name='chart bar' /> Folder Statistics
        </h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5em' }}>
          {/* Total Documents */}
          <div style={{ minWidth: '120px' }}>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#007bff' }}>
              {stats.totalDocuments}
            </div>
            <div style={{ fontSize: '0.9em', color: '#6c757d' }}>
              Total Document{stats.totalDocuments !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Document Types */}
          {Object.keys(stats.documentTypes).length > 0 && (
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '0.25em' }}>
                Document Types:
              </div>
              {Object.entries(stats.documentTypes).map(([type, count]) => (
                <div key={type} style={{ fontSize: '0.85em' }}>
                  <Label size='mini' color='blue'>{type}</Label> {count}
                </div>
              ))}
            </div>
          )}

          {/* Pinned Count */}
          {stats.pinnedCount > 0 && (
            <div style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#ffc107' }}>
                {stats.pinnedCount}
              </div>
              <div style={{ fontSize: '0.9em', color: '#6c757d' }}>
                <Icon name='pin' color='yellow' size='small' />
                Pinned
              </div>
            </div>
          )}

          {/* Total Size */}
          {stats.totalSize > 0 && (
            <div style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#28a745' }}>
                {this.formatFileSize(stats.totalSize)}
              </div>
              <div style={{ fontSize: '0.9em', color: '#6c757d' }}>
                Total Size
              </div>
            </div>
          )}

          {/* Last Modified */}
          {stats.lastModified && (
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '0.25em' }}>
                Last Modified:
              </div>
              <div style={{ fontSize: '0.85em' }}>
                <abbr 
                  className='relative-time' 
                  title={stats.lastModified.toISOString()}
                  style={{ textDecoration: 'none' }}
                >
                  {stats.lastModified.toLocaleDateString()}
                </abbr>
              </div>
            </div>
          )}

          {/* Loading Status */}
          {stats.loadedDocuments < stats.totalDocuments && (
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '0.25em' }}>
                Metadata:
              </div>
              <div style={{ fontSize: '0.85em' }}>
                {stats.loadedDocuments}/{stats.totalDocuments} loaded
                {stats.loadedDocuments < stats.totalDocuments && (
                  <Icon name='loading' loading size='small' style={{ marginLeft: '0.5em' }} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Override renderListItem to show document info instead of raw ID
  renderListItem = (documentId, index) => {
    const document = this.state.documentCache[documentId];

    if (!document) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <Icon name='file' color='grey' />
          <code style={{ color: '#666' }}>{documentId}</code>
          <Label size='mini' color='grey'>Loading...</Label>
        </div>
      );
    }

    // Include folder context in the URL when available
    const { folderId } = this.props;
    const documentUrl = folderId 
      ? `/documents/${document.id}?folder=${folderId}`
      : `/documents/${document.id}`;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
        <Icon name='file text' color='blue' />
        <Link to={documentUrl} style={{ textDecoration: 'none' }}>
          {document.title || document.filename || `Document ${document.id}`}
        </Link>
        {document.fabric_type && (
          <Label size='mini' color='blue'>{document.fabric_type}</Label>
        )}
        {document.summary && (
          <Popup
            content={document.summary}
            trigger={<Icon name='info circle' style={{ cursor: 'pointer', color: '#ccc' }} />}
          />
        )}
      </div>
    );
  };

  renderEditMode () {
    const { currentItems, documentSearchQuery, searchResults, isSearching, contentHistory } = this.state;
    return (
      <div style={{ marginTop: '1em' }}>
        {/* Document Search and Add Controls */}
        <div style={{ marginBottom: '1em' }}>
          <div style={{ marginTop: '0.5em' }}>
            <Input
              fluid
              icon={{ name: 'search', loading: isSearching }}
              placeholder='Search for documents to add...'
              value={documentSearchQuery}
              onChange={(e) => {
                const query = e.target.value;
                this.setState({ documentSearchQuery: query });
                this.handleDocumentSearch(query);
              }}
            />
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{
                border: '1px solid #ddd',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: 'white'
              }}>
                {searchResults.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '0.75em',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5em',
                      backgroundColor: this.state.hoveredResult === doc.id ? '#f8f9fa' : 'white'
                    }}
                    onMouseEnter={() => this.setState({ hoveredResult: doc.id })}
                    onMouseLeave={() => this.setState({ hoveredResult: null })}
                    onClick={() => this.handleAddDocument(doc.id)}
                  >
                    <Icon name='file text' color='blue' />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {doc.title || doc.filename || `Document ${doc.id}`}
                      </div>
                      {doc.fabric_type && (
                        <Label size='mini' color='blue'>{doc.fabric_type}</Label>
                      )}
                    </div>
                    <Icon name='plus' color='green' />
                  </div>
                ))}
              </div>
            )}
            {documentSearchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div style={{
                border: '1px solid #ddd',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                padding: '1em',
                textAlign: 'center',
                color: '#666',
                backgroundColor: 'white'
              }}>
                No documents found matching "{documentSearchQuery}"
              </div>
            )}
          </div>
        </div>
        {/* AI and Undo Controls */}
        <div style={{ marginBottom: '1em' }}>
          <ButtonGroup>
            <Button
              loading={this.state.isImproving}
              disabled={this.state.isImproving || currentItems.length === 0}
              onClick={this.handleImproveWithAI}
            >
              <Icon name='magic' /> Organize with AI
            </Button>
            <Button
              disabled={contentHistory.length === 0}
              onClick={this.handleUndo}
            >
              <Icon name='undo' /> Undo
            </Button>
          </ButtonGroup>
        </div>
        {/* Document List */}
        {currentItems.length > 0 ? (
          <List divided style={{ marginTop: '1em' }}>
            {currentItems.map((documentId, index) => (
              <List.Item key={documentId} style={{ padding: '0.75em 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                  <span style={{ minWidth: '2em', color: '#666' }}>{index + 1}.</span>
                  <div style={{ flex: 1 }}>
                    {this.renderListItem(documentId, index)}
                  </div>
                  <ButtonGroup size='mini'>
                    <Popup content="Move Up" trigger={
                      <Button
                        icon='arrow up'
                        disabled={index === 0}
                        onClick={() => this.handleMoveItem(index, index - 1)}
                      />
                    } />
                    <Popup content="Move Down" trigger={
                      <Button
                        icon='arrow down'
                        disabled={index === currentItems.length - 1}
                        onClick={() => this.handleMoveItem(index, index + 1)}
                      />
                    } />
                    <Popup content="Remove from Folder" trigger={
                      <Button
                        icon='trash'
                        color='red'
                        onClick={() => this.handleRemoveItem(index)}
                      />
                    } />
                  </ButtonGroup>
                </div>
              </List.Item>
            ))}
          </List>
        ) : (
          <Message info>
            <Message.Header>Empty Folder</Message.Header>
            <p>Search for documents above to add them to this folder.</p>
          </Message>
        )}
        
        {/* Folder Statistics */}
        {this.renderStatistics()}
      </div>
    );
  }

  renderViewMode () {
    const { currentItems } = this.state;

    if (!currentItems.length) {
      return (
        <Message info>
          <Message.Header>Empty Folder</Message.Header>
          <p>This folder contains no documents. Click Edit to add documents.</p>
        </Message>
      );
    }

    return (
      <div>
        <List ordered style={{ marginTop: '1em' }}>
          {currentItems.map((documentId, index) => (
            <List.Item key={documentId} style={{ marginBottom: '0.5em' }}>
              {this.renderListItem(documentId, index)}
            </List.Item>
          ))}
        </List>
        
        {/* Folder Statistics */}
        {this.renderStatistics()}
      </div>
    );
  }

  render () {
    const { editable = true, hideEditButton = false, externalEditMode, onEditModeChange } = this.props;
    const { editMode, error } = this.state;
    const currentEditMode = externalEditMode !== undefined ? externalEditMode : editMode;

    const handleEditToggle = () => {
      if (externalEditMode !== undefined && onEditModeChange) {
        onEditModeChange(!externalEditMode);
      } else {
        this.setState(prev => ({ editMode: !prev.editMode }));
      }
    };

    return (
      <fabric-folder-content>
        {editable && !hideEditButton && (
          <div style={{ float: 'right', marginBottom: '1em' }}>
            <Button
              icon
              labelPosition='left'
              onClick={handleEditToggle}
            >
              <Icon name='folder' />
              {currentEditMode ? 'View' : 'Edit'}
            </Button>
          </div>
        )}
        <div style={{ clear: 'both' }}>
          {error && (
            <Message negative onDismiss={this.handleDismissError}>
              <Message.Header>Error</Message.Header>
              <p>{error.content || error.message || 'An error occurred while editing the folder.'}</p>
            </Message>
          )}
          {currentEditMode ? this.renderEditMode() : this.renderViewMode()}
        </div>
      </fabric-folder-content>
    );
  }
}

module.exports = FolderContent; 