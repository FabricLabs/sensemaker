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
  Search
} = require('semantic-ui-react');

const formatDate = require('../contracts/formatDate');

class LibrarySearch extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', 
      filteredResults: {}, // Should be an object
      loading: false,
      results: null,
    };
  }

  componentDidMount = () => {
  }

  componentDidUpdate = (prevProps) => {
    
    const {search} = this.props;
    if(prevProps.search != search){
      if(!search.searching && !search.error && this.state.loading){
        this.setState({filteredResults: search.result.results, loading: false});
      }
    }
  }

  handleSearchChange = debounce(async (query) => {
    this.setState({ loading: true });
    this.props.searchGlobal(query);  
  }, 1000);

  // renderResults() {
  //   const { filteredResults } = this.state;
  //   console.log(filteredResults);
  //   if (Object.keys(filteredResults).length > 0) {
  //     const categories = Object.keys(filteredResults).map(category => ({
  //       name: category,
  //       results: Array.isArray(filteredResults[category]) ? filteredResults[category].map(item => ({
  //         title: item.title,
  //         description: item.description,
  //       })) : [],
  //     }));
  //     console.log("categorias", categories);
  //     return categories;
  //   } else return [];
  // }

  renderResults = () => {
    const { filteredResults } = this.state;
    // Check if there are any results and specifically if there are any 'cases'
    if (Object.keys(filteredResults).length > 0 && filteredResults['cases'] && filteredResults['cases'].length >0) {
        // Directly work with 'cases' category
        const casesCategory = [{
            name: 'cases',
            results: Array.isArray(filteredResults['cases']) ? filteredResults['cases'].map(item => ({
                title: <Link to={"/cases/" + item.id} style={{fontSize: '0.8em', margin: '0'}}>{item.short_name}</Link>,
                description: <p style={{fontSize:'0.7em'}}>{item.title}</p>,
            })) : [],
        }];
        console.log("categories", casesCategory);
        return casesCategory;
    } else return [];
}

  render() {
    const { loading } = this.state;
    
    return (
      <Search
        id='global-search'
        name='query'
        autoComplete='off'
        placeholder='Find...'
        category
        // size='tiny'
        loading={loading}
        value={this.state.searchQuery}
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
