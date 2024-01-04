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
  Icon
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class CaseHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredCases: [], // Initialize filtered cases state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount () {
    this.props.fetchCases();
  }

  handleSearchChange = debounce((query) => {
    this.setState({ searching: true });

    fetch('/cases', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'SEARCH',
      body: JSON.stringify({ query })
    }).then(async (result) => {
      const obj = await result.json();
      console.debug('fetch result: ', obj);

      this.setState({
        filteredCases: obj.content,
        searchQuery: query,
      });
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      this.setState({ searching: false }); // Set searching to false after fetch is complete
    });
  }, 1000);

  render () {
    const { loading, error } = this.props;
    const { filteredCases, searchQuery, searching } = this.state;

    return (
      <Segment className="fade-in" fluid style={{ marginRight: '1em' }}>
        <h1>Cases</h1>
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
          {searching ? (
            <Loader active inline="centered" /> // Display loading icon if searching is true
          ) : searchQuery ? (filteredCases && filteredCases.cases && filteredCases.cases.length > 0 ? (
              filteredCases.cases.map((instance) => (
                <List.Item as={Card} key={instance.id} loading={loading}>
                  <Card.Content>
                    <h3><Link to={"/cases/" + instance.id}>{instance.short_name}</Link></h3>
                    <Label.Group basic>
                      <Label><Icon name="calendar"/>{formatDate(instance.decision_date)}</Label>
                      <Label><Icon name="law"/>{instance.court_name}</Label>
                    </Label.Group>
                    <p>{instance.content}</p>
                  </Card.Content>
                </List.Item>
              )
            )
          ) : (<p>No results found</p>)) : this.props.cases && this.props.cases.cases && this.props.cases.cases.length > 0 ? (
              this.props.cases.cases.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/cases/" + instance.id}> {instance.short_name} </Link> </h3>
                    <Label.Group basic>
                      <Label><Icon name="calendar"/>{formatDate(instance.decision_date)}</Label>
                      <Label><Icon name="law"/>{instance.court_name}</Label>
                    </Label.Group>
                    <p>{instance.content}</p>
                  </Card.Content>
                </List.Item>
              ))
            ) : (<Loader active inline="centered" />)
          }
        </List>
      </Segment>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

module.exports = CaseHome;
