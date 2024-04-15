'use strict';

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
  Loader
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class CourtHome extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredCourts: [], // Initialize filtered courts state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount() {
    this.props.fetchCourts();
  }

  componentDidUpdate(prevProps) {
    const { courts } = this.props;
    if (prevProps.courts != courts) {
      if (!courts.loading && this.state.searching) {
        this.setState({ filteredCourts: courts.results, searching: false });
      }
    }
  }

  handleSearchChange = debounce((query) => {
    //console.debug('search change:', query);

    this.setState({ searching: true });
    this.props.searchCourt(query);
  }, 1000);

  render() {
    const { loading, courts } = this.props;
    const { filteredCourts, searchQuery, searching } = this.state;

    const displayCourts = searchQuery ? filteredCourts : courts;

    return (
      <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
        <h1>Courts</h1>
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
          {searching || courts.loading ? (
            <Loader active inline="centered" /> // Display loading icon if searching is true
          ) :
            (displayCourts && displayCourts.courts && displayCourts.courts.length > 0 ? (
              displayCourts.courts.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/courts/" + instance.slug}>{instance.short_name}</Link></h3>
                    <Label.Group basic>
                      <Label icon="calendar">{formatDate(instance.founded_date)}</Label>
                      <Label icon="law">{instance.jurisdiction}</Label>
                    </Label.Group>
                    <p>{instance.content}</p>
                  </Card.Content>
                </List.Item>
              ))
            ) : (<p>No results found</p>))
          }
        </List>
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = CourtHome;
