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
  Icon,
  Search
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class LibrarySearch extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredResults: {}, // Should be an object
      searching: false, // Boolean to show a spinner icon while fetching
      results: null,
    };
  }

  componentDidMount() {
  }

  handleSearchChange = debounce(async (query) => {
    this.setState({ searching: true });

    const fetchPromise = fetch(`/`, {
      method: 'SEARCH',
      headers: {
        Authorization: `Bearer ${this.props.auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query }),
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Fetch timed out'));
      }, 15000);
    });

    try {
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      const respuesta = await response.json();
      console.log(respuesta.results);
      this.setState({ filteredResults: respuesta.results, searching: false });

    } catch (error) {
      if (error.message === 'Fetch timed out') {
        console.log("check your internet connection");
      } else {
        console.error('Title update Error:', error.message);
      }
    }
  }, 1000);

  renderResults() {
    const { filteredResults } = this.state;
    console.log(filteredResults);
    if (Object.keys(filteredResults).length > 0) {
      const categories = Object.keys(filteredResults).map(category => ({
        name: category,
        results: Array.isArray(filteredResults[category]) ? filteredResults[category].map(item => ({
          title: item.title,
          description: item.description,
        })) : [],
      }));
      console.log("categorias", categories);
      return categories;
    } else return [];
  }

  render() {
    const { searchQuery } = this.state;
    return (
      <Search
        name='query'
        autoComplete='off'
        placeholder='Find...'
        category
        //value={searchQuery}
        results={this.renderResults()}
        onSearchChange={(e) => {
          const query = e.target.value;
          this.setState({ searchQuery: query });
          this.handleSearchChange(query); // Call the debounce function with the query
        }}
      />
    );
  }

  _toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML() {
    return this._toHTML();
  }
}

module.exports = LibrarySearch;
