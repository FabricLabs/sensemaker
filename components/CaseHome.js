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

class CaseHome extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredCases: [], // Initialize filtered cases state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount() {
    this.props.fetchCases();
  }

  componentDidUpdate(prevProps) {
    const { cases } = this.props;
    if (prevProps.cases != cases) {
      if (!cases.loading && this.state.searching) {
        this.setState({ filteredCases: cases.results, searching: false });
      }
    }
  }

  handleSearchChange = debounce((query) => {
    this.setState({ searching: true });
    this.props.searchCase(query);
  }, 1000);

  render() {
    const { loading, error, cases } = this.props;
    const { filteredCases, searchQuery, searching } = this.state;

    const totalCases = 0;
    const totalJurisdictions = 0;

    const displayCases = searchQuery ? filteredCases : cases;

    return (
      <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
        <h1>Cases</h1>
        <p>{BRAND_NAME} is tracking <strong>{totalCases}</strong> cases in <strong>{totalJurisdictions}</strong> jurisictions.</p>
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
          {(searching || cases.loading) ? (
            <Loader active inline="centered" /> // Display loading icon if searching is true
          ) : (displayCases && displayCases.cases && displayCases.cases.length > 0 ? (
            displayCases.cases.map((instance) => (
              <List.Item as={Card} key={instance.id} loading={loading}>
                <Card.Content>
                  <h3><Link to={"/cases/" + instance.id} onClick={() => this.props.resetChat()}>{instance.short_name}</Link></h3>
                  <Label.Group basic>
                    <Label><Icon name="calendar" />{formatDate(instance.decision_date)}</Label>
                    <Label><Icon name="law" />{instance.court_name}</Label>
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

module.exports = CaseHome;
