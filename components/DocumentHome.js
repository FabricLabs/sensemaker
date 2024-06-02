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
  TextArea
} = require('semantic-ui-react');
const DocumentUploader = require('./DocumentUploader');

const formatDate = require('../contracts/formatDate');

class DocumentHome extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredDocuments: [], // Initialize filtered documents state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount() {
    this.props.fetchDocuments();
  }

  componentDidUpdate(prevProps) {
    const { documents } = this.props;
    if (prevProps.documents != documents) {
      if (!documents.loading && this.state.searching) {
        this.setState({ filtereDocuments: documents.results, searching: false });
      }
    }
  }


  handleSearchChange = debounce((query) => {
    //console.debug('search change:', query);

    this.setState({ searching: true });
    this.props.searchDocument(query);
  }, 1000);

  render() {
    const { loading, documents } = this.props;
    const { filteredDocuments, searchQuery, searching } = this.state;

    const displayDocuments = searchQuery ? filteredDocuments : documents;

    return (
      <fabric-document-home>
        <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
          <Button color='green' floated='right' as={Link} to='/documents/draft'>Create Document &raquo;</Button>
          <h1>Documents</h1>
          <DocumentUploader files={this.props.files} uploadFile={this.props.uploadFile} resetChat={this.props.resetChat} />
          <jeeves-search fluid placeholder='Find...' className='ui search'>
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
              <i aria-hidden="true" className="search icon"></i>
            </div>
          </jeeves-search>
          <List as={Card.Group} doubling centered loading={loading} style={{ marginTop: "1em" }}>
            {(searching || documents.loading) ? (
              <Loader active inline="centered" /> // Display loading icon if searching is true
            ) :
              (displayDocuments && displayDocuments.documents && displayDocuments.documents.length > 0 ? (
                displayDocuments.documents.map((instance) => (
                  <List.Item as={Card} key={instance.id}>
                    <Card.Content>
                      {(instance.title !== 'Untitled Document') ? (
                        <h3><Link to={"/documents/" + instance.fabric_id}>{instance.title} (doc #{instance.fabric_id}) </Link></h3>
                      ) : (
                        <h3><Link to={"/documents/" + instance.fabric_id}>(doc #{instance.fabric_id}) </Link></h3>
                      )}
                      <Label.Group basic>
                        <Label title='Creation date'><Icon name='calendar alternate outline' /> {instance.created_at}</Label>
                        <p>{instance.description}</p>
                      </Label.Group>
                    </Card.Content>
                  </List.Item>
                ))
              ) : (<p>No results found</p>)
              )
            }
          </List>
          <Segment>
            <Form>
              <Form.Field>
                <Header as='h3'>Draft Documents</Header>
                <p>Start drafting a new document by telling me the details of your case.</p>
                <Form.TextArea />
                <Button icon='file'>Draft</Button>
              </Form.Field>
            </Form>
          </Segment>
        </Segment>

      </fabric-document-home>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DocumentHome;
