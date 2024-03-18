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

class OpinionHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      searchQuery: '', // Initialize search query state
      filteredOpinions: [], // Initialize filtered courts state
      searching: false // Boolean to show a spinner icon while fetching
    };
  }

  componentDidMount () {
    this.props.fetchOpinions();
  }

  handleSearchChange = debounce((query) => {
    //console.debug('search change:', query);

    this.setState({ searching: true });

    fetch('/courts', {
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
        filteredOpinions: obj.content,
        searchQuery: query,
      });
    }).catch((error) => {
      console.error('Error fetching data:', error);
    }).finally(() => {
      this.setState({ searching: false }); // Set searching to false after fetch is complete
    });
  }, 1000);

  render () {
    const { loading, error } = this.props;
    const { filteredOpinions, searchQuery, searching } = this.state;

    return (
      <Segment className="fade-in" fluid style={{ maxHeight: '100%' }}>
        <h1>Opinions</h1>
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
        <List as={Card.Group} doubling cetered loading={loading} style={{ marginTop: "1em" }}>
        {searching ? (
            <Loader active inline="centered" /> // Display loading icon if searching is true
          ) :
          searchQuery ? // if searching, goes this way
            (filteredOpinions && filteredOpinions.courts && filteredOpinions.courts.length > 0 ? (
              filteredOpinions.courts.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/courts/" + instance.id}>{instance.short_name}</Link></h3>
                    <Label.Group basic>
                      <Label icon="calendar">{formatDate(instance.decision_date)}</Label>
                      <Label icon="law">{instance.court_name}</Label>
                    </Label.Group>
                    <p>{instance.content}</p>
                  </Card.Content>
                </List.Item>
              ))
              ) : (<p>No results found</p>)
            ) : this.props.courts && this.props.courts.courts && this.props.courts.courts.length > 0 ? (
              this.props.courts.courts.map((instance) => (
                <List.Item as={Card} key={instance.id}>
                  <Card.Content>
                    <h3><Link to={"/courts/" + instance.id}> {instance.short_name} </Link> </h3>
                    <Label.Group basic>
                      <Label icon="calendar">{formatDate(instance.decision_date)}</Label>
                      <Label icon="law">{instance.court_name}</Label>
                    </Label.Group>
                    <p>{instance.content}</p>
                  </Card.Content>
                </List.Item>
              ))
            ) : (<p>No opinions available</p>)
          }
        </List>
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = OpinionHome;
