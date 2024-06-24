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
  Loader,
  Dropdown,
  Input,
  Form
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class CourtHome extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredCourts: [], // Initialize filtered courts state
      searching: false, // Boolean to show a spinner icon while fetching
      jurisdictionsOptions: null,
      jurisdiction_id: null,
    };
  }

  componentDidMount() {
    this.props.fetchCourts();
    this.props.fetchJurisdictions();
  }

  componentDidUpdate(prevProps) {
    const { courts, jurisdictions } = this.props;
    if (prevProps.courts != courts) {
      if (!courts.loading && this.state.searching) {
        this.setState({ filteredCourts: courts.results, searching: false });
        console.log('court-results: ', courts.results);
      }
    }

    if (prevProps.jurisdictions !== jurisdictions) {
      if (jurisdictions.jurisdictions.length > 0) {
        const options = jurisdictions.jurisdictions.map(instance => ({
          key: instance.id,
          value: instance.id,
          text: instance.name
        }));
        options.sort((a, b) => a.text.localeCompare(b.text));
        options.unshift({ key: 'any', value: null, text: 'Any' });
        this.setState({ jurisdictionsOptions: options });
      }
    }
  }

  selectJurisdiction = (value) => {
    const { searchQuery } = this.state;
    this.setState({ jurisdiction_id: value, jurisdictionError: false });
    if (searchQuery) {
      this.handleSearchChange(searchQuery);
    } else {
      if (value === null) {
        this.props.fetchCourts();
      } else {
        //once the jurisdiction is selected, it looks for the courts related to that jurisdiction
        this.props.fetchCourtsByJurisdiction(value);
      }
    }
  }

  handleSearchChange = debounce((query) => {
    //console.debug('search change:', query);
    const { jurisdiction_id } = this.state;
    if (query) {
      this.setState({ searching: true });
      this.props.searchCourt(query, jurisdiction_id);
    }
  }, 1000);

  render() {
    const { loading, courts } = this.props;
    const { filteredCourts, searchQuery, searching, jurisdictionsOptions } = this.state;

    const displayCourts = searchQuery ? filteredCourts : courts;

    return (
      <Segment className="fade-in" fluid style={{ maxHeight: '100%', minHeight: '100%' }}>
        <h1>Courts</h1>
        <Form style={{ display: 'flex', gap: '1em', width: '100%' }} size='huge'>
          <Input
            style={{ width: '50%' }}
            name='query'
            autoComplete='off'
            placeholder='Find...'
            type='text'
            tabIndex='0'
            className='prompt'
            icon='search'
            iconPosition='right'
            onChange={(e) => {
              const query = e.target.value;
              this.setState({ searchQuery: query });
              this.handleSearchChange(query); // Call the debounce function with the query
            }}
          />
          <Dropdown
            style={{ width: '50%' }}
            placeholder='Filter by Jurisdiction'
            fluid
            search
            selection
            options={jurisdictionsOptions}
            value={this.state.jurisdiction_id}
            onChange={(e, { value }) => this.selectJurisdiction(value)}
          />
        </Form>
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
