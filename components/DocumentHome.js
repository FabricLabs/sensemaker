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

  handleSearchChange = debounce((query) => {
    //console.debug('search change:', query);

    this.setState({ searching: true });

    fetch('/documents', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'SEARCH',
      body: JSON.stringify({ query })
    }).then(async (result) => {
      const obj = await result.json();
      console.log('fetch result: ', obj);

      this.setState({
        filteredDocuments: obj.content,
        searchQuery: query,
      });
    }).catch((error) => {
      console.error('Error fetching data:', error);
    }).finally(() => {
      this.setState({ searching: false }); // Set searching to false after fetch is complete
    });
  }, 1000);

  render() {
    const { loading, error } = this.props;
    const { filteredDocuments, searchQuery, searching } = this.state;

    return (
      <fabric-document-home>
        <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
          <Button>Create Document &raquo;</Button>
          <h1>Documents</h1>
          {/* <Form className='documents-upload-form'>
            <Form.Field>
              <div style={{maxWidth: '500px', gap: '0.5em', display: 'flex'}}>
                <Input type='file' name='file' />
                <Button icon='upload'>Upload</Button>
              </div>
            </Form.Field>
          </Form> */}
          <DocumentUploader uploadDocument={this.props.uploadDocument}/>
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
            {searching ? (
              <Loader active inline="centered" /> // Display loading icon if searching is true
            ) :
              searchQuery ? // if searching, goes this way
                (filteredDocuments && filteredDocuments.documents && filteredDocuments.documents.length > 0 ? (
                  filteredDocuments.documents.map((instance) => (
                    <List.Item as={Card} key={instance.id}>
                      <Card.Content>
                        {(instance.title !== 'Untitled Document') ? (
                          <h3><Link to={"/documents/" + instance.fabric_id}>{instance.title} (doc #{instance.fabric_id}) </Link></h3>
                        ) : (
                          <h3><Link to={"/documents/" + instance.fabric_id}>(doc #{instance.fabric_id}) </Link></h3>
                        )}
                        {/* <h3><Link to={"/"}>{instance.short_name} (doc #{instance.id}) </Link></h3> */}
                        <Label.Group basic>
                          <Label title='Creation date'><Icon name='calendar alternate outline' /> {instance.created_at}</Label>
                          <p>{instance.description}</p>
                        </Label.Group>
                      </Card.Content>
                    </List.Item>
                  ))
                ) : (<p>No results found</p>)
                ) : this.props.documents && this.props.documents.documents && this.props.documents.documents.length > 0 ? (
                  this.props.documents.documents.map((instance) => (
                    <List.Item as={Card} key={instance.id}>
                      <Card.Content>
                        {/* <h3><Link to={"/"}> (doc #{instance.id})</Link> </h3> */}
                        {(instance.title !== 'Untitled Document') ? (
                          <h3><Link to={"/documents/" + instance.id}>{instance.title} (doc #{instance.id}) </Link></h3>
                        ) : (
                          <h3><Link to={"/documents/" + instance.id}>(doc #{instance.id}) </Link></h3>
                        )}
                        <Label.Group basic>
                          <Label title='Creation date'><Icon name='calendar alternate outline' /> {instance.created_at}</Label>
                          <p>{instance.description}</p>
                        </Label.Group>
                      </Card.Content>
                    </List.Item>
                  ))
                ) : (<p>No documents available</p>)
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
