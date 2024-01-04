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

class PeopleHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredPeople: [], // Initialize filtered people state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount () {
    this.props.fetchPeople();
  }

  handleSearchChange = debounce((query) => {
    this.setState({ searching: true });

    fetch('/people', {
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
        filteredPeople: obj.content,
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
    const { filteredPeople, searchQuery, searching } = this.state;

    return (
      <Segment className="fade-in" fluid style={{ marginRight: '1em' }}>
        <h1>People</h1>
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
            (filteredPeople && filteredPeople.people && filteredPeople.people.length > 0 ? (
              filteredPeople.people.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/people/" + instance.id}> {instance.full_name} </Link> </h3>
                    <Label.Group basic>
                      <Label title='Date of birth'><Icon name='calendar alternate outline' /> {instance.date_of_birth}</Label>
                      <Label title='City/State of birth '><Icon name='building'/> {instance.birth_city}, {instance.birth_state}</Label>
                    </Label.Group>
                  </Card.Content>
                </List.Item>
              ))
              ) : (<p>No results found</p>)
            ) : this.props.people && this.props.people.people && this.props.people.people.length > 0 ? (
              this.props.people.people.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/people/" + instance.id}> {instance.full_name} </Link> </h3>
                    <Label.Group basic>
                      <Label title='Date of birth'><Icon name='calendar alternate outline' /> {instance.date_of_birth}</Label>
                      <Label title='City/State of birth '><Icon name='building'/> {instance.birth_city}, {instance.birth_state}</Label>
                    </Label.Group>
                  </Card.Content>
                </List.Item>
              ))
            ) : (<p>No people available</p>)
          }
        </List>
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = PeopleHome;
