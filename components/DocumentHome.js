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
  Label,
  List,
  Loader,
  Icon,
  Input,
  Form,
  TextArea,
  Message
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');
const DocumentUploader = require('./DocumentUploader');
const UserProfileSection = require('./UserProfileSection');
const FileUploadModal = require('./FileUploadModal');
const CreateDocumentModal = require('./CreateDocumentModal');

// Functions
const formatDate = require('../functions/formatDate');

class DocumentHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredDocuments: [], // Initialize filtered documents state
      searching: false, // Boolean to show a spinner icon while fetching
      createModalOpen: false, // Add state for create modal visibility
      uploadModalOpen: false // Add state for upload modal visibility
    };
  }

  componentDidMount () {
    this.props.fetchDocuments();
  }

  componentDidUpdate (prevProps) {
    const { documents } = this.props;
    if (prevProps.documents != documents) {
      if (!documents.loading && this.state.searching) {
        this.setState({ filtereDocuments: documents.results, searching: false });
      }
    }
  }

  handleSearchChange = debounce((query) => {
    // console.debug('search change:', query);
    this.setState({ searching: true });
    // TODO: change to `searchDocuments`
    this.props.searchDocument(query);
  }, 1000);

  initiateDocumentCreation = () => {
    this.setState({ createModalOpen: true });
  }

  initiateFileUpload = () => {
    this.setState({ uploadModalOpen: true });
  }

  handleCreateModalClose = () => {
    this.setState({ createModalOpen: false });
  }

  handleUploadModalClose = () => {
    this.setState({ uploadModalOpen: false });
  }

  render () {
    const { loading, documents } = this.props;
    const { filteredDocuments, searchQuery, searching, createModalOpen, uploadModalOpen } = this.state;
    const displayDocuments = searchQuery ? filteredDocuments : documents;

    return (
      <fabric-document-home>
        <Segment className='fade-in' fluid style={{ maxHeight: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
            <h1 style={{ marginTop: '0' }}>Library</h1>
            <Button.Group>
              {/* <Button icon onClick={this.props.fetchDocuments} disabled title='Local library is disabled.  No documents will be loaded from the working directory.'><Icon name='stop' /></Button> */}
              <Button icon color='blue' onClick={this.initiateFileUpload}><Icon name='upload' /></Button>
              <Button icon color='green' onClick={this.initiateDocumentCreation}>Create Document <Icon name='add' /></Button>
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
                  this.handleSearchChange(query); // Call the debounce function with the query
                }}
              />
              <i aria-hidden='true' className="search icon"></i>
            </div>
          </fabric-search>
          <List as={Card.Group} doubling loading={loading} style={{ marginTop: '1em', marginBottom: '1em' }}>
            {displayDocuments && displayDocuments.documents && displayDocuments.documents.length === 0 && (
              <List.Item as={Card} key='create-new-document' onClick={this.initiateDocumentCreation} style={{ cursor: 'pointer', background: '#f9f9f9', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Card.Content textAlign='center'>
                  <Icon name='add circle' size='huge' color='green' />
                  <Header as='h3' color='green' style={{ marginTop: '0.5em' }}>Create New Document</Header>
                  <p>Start a new document from scratch</p>
                </Card.Content>
              </List.Item>
            )}
            {(searching || documents.loading) ? (
              <Loader active inline='centered' /> // Display loading icon if searching is true
            ) : (displayDocuments && displayDocuments.documents && displayDocuments.documents.length > 0 ? (
              displayDocuments.documents.slice(0, 11).map((instance) => (
                <List.Item as={Card} key={instance.id} loading={(instance.ingestion_status === 'processing')}>
                  <Card.Content loading={(instance.ingestion_status === 'processing')}>
                    <h3><Link to={'/documents/' + instance.fabric_id}>{instance.title}</Link></h3>
                    {(instance.ingestion_status === 'processing') ? <Message icon size='tiny'>
                      <Icon name='circle notched' loading />
                      <Message.Content>
                        <Message.Header>Your document is being processed...</Message.Header>
                      </Message.Content>
                    </Message> : <div>
                      <Label.Group basic>
                        <Label title='Creation date'><Icon name='calendar alternate outline' /> <abbr className='relative-time' title={instance.created_at}>{instance.created_at}</abbr></Label>
                      </Label.Group>
                      <p title={instance.summary || instance.description}>{instance.description}</p>
                    </div>}
                  </Card.Content>
                  <Button.Group attached='bottom'>
                    <Button as={Link} to={'/documents/' + instance.fabric_id}><Icon name='linkify' /></Button>
                    <Button as={Link} to={'/documents/' + instance.fabric_id + '#pin'}><Icon name='thumbtack' /></Button>
                  </Button.Group>
                </List.Item>
              ))) : (<p>You haven't uploaded any documents yet!</p>)
            )}
          </List>
          {(displayDocuments && displayDocuments.documents && displayDocuments.documents.length > 0 ? (
            <ChatBox
              {...this.props}
              messagesEndRef={this.messagesEndRef}
              includeFeed={false}
              placeholder={'Ask about these documents...'}
              context={{ documents: displayDocuments }}
              resetInformationSidebar={this.props.resetInformationSidebar}
              messageInfo={this.props.messageInfo}
              thumbsUp={this.props.thumbsUp}
              thumbsDown={this.props.thumbsDown}
            />
          ) : null)}
        </Segment>

        <CreateDocumentModal
          open={createModalOpen}
          onClose={this.handleCreateModalClose}
          token={this.props.token}
          navigate={this.props.navigate}
        />

        <FileUploadModal
          open={uploadModalOpen}
          onClose={this.handleUploadModalClose}
          uploadFile={this.props.uploadFile}
          navigate={this.props.navigate}
        />
      </fabric-document-home>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DocumentHome;
