'use strict';

const {
  BRAND_NAME
} = require('../constants');

const debounce = require('lodash.debounce');
const fetch = require('cross-fetch');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Card,
  Segment,
  Label,
  List,
  Loader,
  Icon
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class UploadHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      searchQuery: '', // Initialize search query state
      filteredUploads: [], // Initialize filtered files state
      searching: false // Boolean to show a spinner icon while fetching
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchUploads();
  }

  componentDidUpdate (prevProps) {
    const { files } = this.props;
    if (prevProps.files != files) {
      if (!files.loading && this.state.searching) {
        this.setState({ filteredUploads: files.results, searching: false });
      }
    }
  }

  handleSearchChange = debounce((query) => {
    this.setState({ searching: true });
    this.props.searchUpload(query);
  }, 1000);

  render () {
    const { loading, error, files } = this.props;
    const { filteredUploads, searchQuery, searching } = this.state;
    const totalUploads = 0;
    const displayUploads = searchQuery ? filteredUploads : files;

    return (
      <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
        <h1>Files</h1>
        <p><strong>{totalUploads}</strong> files.</p>
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
        <List as={Card.Group} doubling centered loading={loading} style={{ marginTop: '1em' }}>
          {(searching || files.loading) ? (
            <Loader active inline="centered" /> // Display loading icon if searching is true
          ) : (displayUploads && displayUploads.files && displayUploads.files.length > 0 ? (
            displayUploads.files.map((instance) => (
              <List.Item as={Card} key={instance.id} loading={loading}>
                <Card.Content>
                  <h3><Link to={"/files/" + instance.id} onClick={() => this.props.resetChat()}>{instance.name}</Link></h3>
                  <Label.Group basic>
                    <Label><Icon name="calendar" />{formatDate(instance.decision_date)}</Label>
                  </Label.Group>
                  <p>{instance.content}</p>
                </Card.Content>
              </List.Item>
            ))
          )
            : (<p>No results found</p>))
          }
        </List>
      </Segment>
    );
  }

  _toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML() {
    return this._toHTML();
  }
}

module.exports = UploadHome;
