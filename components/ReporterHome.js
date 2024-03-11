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

class ReporterHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredReporters: [], // Initialize filtered reporters state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount () {
    this.props.fetchReporters();
  }

  handleSearchChange = debounce((query) => {
    this.setState({ searching: true });

    fetch('/reporters', {
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
        filteredReporters: obj.content,
        searchQuery: query,
      });
    }).catch((error) => {
      console.error('Error fetching data:', error);
    }).finally(() => {
      this.setState({ searching: false }); // Set searching to false after fetch is complete
    });
  }, 1000);

  render () {
    const { loading, error, } = this.props;
    const { filteredReporters, searchQuery, searching } = this.state;
    console.log(filteredReporters);
    return (
      <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
        <h1>Reporters</h1>
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
        <List as={Card.Group} doubling loading={loading} style={{ marginTop: "1em" }}>
        {searching ? (
            <Loader active inline="centered" /> // Display loading icon if searching is true
          ) :
          searchQuery ? // if searching, goes this way
            (filteredReporters && filteredReporters.reporters && filteredReporters.reporters.length > 0 ? (
              filteredReporters.reporters.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/reporters/" + instance.id}> {instance.full_name} </Link> </h3>
                    <Label.Group basic>
                      <Label title='Date of birth'><Icon name='calendar alternate outline' /> {instance.date_of_birth}</Label>
                      <Label title='City/State of birth '><Icon name='building'/> {instance.birth_city}, {instance.birth_state}</Label>
                    </Label.Group>
                  </Card.Content>
                </List.Item>
              ))
              ) : (<p>No results found</p>)
            ) : this.props.reporters && this.props.reporters.reporters && this.props.reporters.reporters.length > 0 ? (
              this.props.reporters.reporters.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/reporters/" + instance.id}> {instance.full_name} </Link> </h3>
                    <Label.Group basic>
                      <Label title='Date of birth'><Icon name='calendar alternate outline' /> {instance.date_of_birth}</Label>
                      <Label title='City/State of birth '><Icon name='building'/> {instance.birth_city}, {instance.birth_state}</Label>
                    </Label.Group>
                  </Card.Content>
                </List.Item>
              ))
            ) : (<p>No reporters available</p>)
          }
        </List>
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = ReporterHome;
