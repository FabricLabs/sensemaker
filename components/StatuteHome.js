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

class StatuteHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredStatutes: [], // Initialize filtered statutes state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount () {
    this.props.fetchStatutes();
  }

  handleSearchChange = debounce((query) => {
    this.setState({ searching: true });

    fetch('/statutes', {
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
        filteredStatutes: obj.content,
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
    const { filteredStatutes, searchQuery, searching } = this.state;

    const totalStatutes = 0;

    return (
      <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
        <h1>Statutes</h1>
        <p>{BRAND_NAME} is tracking <strong>{totalStatutes}</strong> statutes.</p>
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
          ) : searchQuery ? (filteredStatutes && filteredStatutes.statutes && filteredStatutes.statutes.length > 0 ? (
              filteredStatutes.statutes.map((instance) => (
                <List.Item as={Card} key={instance.id} loading={loading}>
                  <Card.Content>
                    <h3><Link to={"/statutes/" + instance.id}>{instance.name}</Link></h3>
                    <p>{instance.description}</p>
                  </Card.Content>
                </List.Item>
              )
            )
          ) : (<p>No results found</p>)) : this.props.statutes && this.props.statutes.statutes && this.props.statutes.statutes.length > 0 ? (
              this.props.statutes.statutes.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/statutes/" + instance.id}> {instance.name} </Link> </h3>
                    <p>{instance.description}</p>
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

module.exports = StatuteHome;
