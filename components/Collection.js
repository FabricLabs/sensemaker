'use strict';

// Dependencies
const debounce = require('lodash.debounce');
const fetch = require('cross-fetch');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Card,
  Segment,
  Label,
  List,
  Loader
} = require('semantic-ui-react');

const {
  Segment
} = require('semantic-ui-react');

/**
 * Generic collection of items.
 */
class Collection extends React.Component {
  constructor () {
    super(...props);

    this.state = {
      collection: props.collection || {},
      endpoint: '/cases'
    };

    return this;
  }
  render () {
    const { loading, error, name } = this.props;
    const { filteredItems, searchQuery, searching } = this.state;

    // TODO: assign endpoint to search
    // TODO: generalize collection contents into cards
    return (
      <Segment className="fade-in" fluid style={{ marginRight: '1em' }}>
        {(name) ? <h1>{name}</h1> : null}
        <fabric-search fluid placeholder='Find...' className='ui search'>
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
        </fabric-search>
        <List as={Card.Group} doubling centered loading={loading} style={{ marginTop: '1em' }}>
          {searching ? (
            <Loader active inline="centered" /> // Display loading icon if searching is true
          ) : searchQuery ? (filteredItems && filteredItems.cases && filteredItems.cases.length > 0 ? (
              filteredItems.cases.map((instance) => (
                <List.Item as={Card} key={instance.id} loading={loading}>
                  <Card.Content>
                    <h3><Link to={"/cases/" + instance.id}>{instance.short_name}</Link></h3>
                    <Label.Group basic>
                      <Label icon="calendar">{formatDate(instance.decision_date)}</Label>
                      <Label icon="law">{instance.court_name}</Label>
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
                      <Label icon="calendar">{formatDate(instance.decision_date)}</Label>
                      <Label icon="law">{instance.court_name}</Label>
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
}

module.exports = Collection;
