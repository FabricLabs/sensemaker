'use strict';

const debounce = require('lodash.debounce');
const fetch = require('cross-fetch');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

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

const ChatBox = require('./ChatBox');
const DocumentUploader = require('./DocumentUploader');

const formatDate = require('../contracts/formatDate');

class DocumentHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredDocuments: [], // Initialize filtered documents state
      searching: false // Boolean to show a spinner icon while fetching
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

  render () {
    const { loading, documents } = this.props;
    const { filteredDocuments, searchQuery, searching } = this.state;
    const displayDocuments = searchQuery ? filteredDocuments : documents;

    return (
      <fabric-document-home>
        <Segment className='fade-in' fluid style={{ maxHeight: '100%' }}>
          {/* <Button color='green' floated='right' as={Link} to='/documents/draft'>Create Document &raquo;</Button> */}
          <h1>Library</h1>
          <p>Search, upload, and manage files.</p>
          <DocumentUploader files={this.props.files} uploadFile={this.props.uploadFile} resetChat={this.props.resetChat} fetchDocuments={this.props.fetchDocuments} />
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
          <List as={Card.Group} doubling centered loading={loading} style={{ marginTop: '1em', marginBottom: '1em' }}>
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
                        <Message.Header>Your document is being ingested by the AI</Message.Header>
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
              ))) : (<p>No results found</p>)
            )}
          </List>
          <ChatBox
            {...this.props}
            messagesEndRef={this.messagesEndRef}
            includeFeed={false}
            placeholder={'Ask about these documents...'}
            resetInformationSidebar={this.props.resetInformationSidebar}
            messageInfo={this.props.messageInfo}
            thumbsUp={this.props.thumbsUp}
            thumbsDown={this.props.thumbsDown}
          />
        </Segment>
      </fabric-document-home>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DocumentHome;
