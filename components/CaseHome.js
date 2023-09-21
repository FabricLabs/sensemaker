'use strict';

const debounce = require('lodash.debounce');
const fetch = require('cross-fetch');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Card,
  Segment,
  List
} = require('semantic-ui-react');

class CaseHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
  }

  componentDidMount () {
    this.props.fetchCases();
  }

  handleSearchChange = (e) => {
    console.debug('search change:', e.target.value);
    // this.setState({ [name]: value });

    fetch('/cases', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'SEARCH',
      body: JSON.stringify({ query: e.target.value })
    }).then(async (result) => {
      const obj = await result.json();
      console.debug('result of search:', obj);
    });
  }

  render () {
    const { loading, error, cases } = this.props;

    return (
      <Segment className='fade-in' fluid style={{ marginRight: '1em' }}>
        <h1>Cases</h1>
        <jeeves-search fluid placeholder='Find...' className="ui search">
          <div className="ui huge icon fluid input">
            <input name="query" autoComplete="off" placeholder="Find..." type="text" tabIndex="0" className="prompt" /* value={this.state.search} */ onChange={debounce(this.handleSearchChange, 1000)} />
            <i aria-hidden="true" className="search icon"></i>
          </div>
        </jeeves-search>
        <List as={Card.Group} doubling loading={loading} style={{ marginTop: '1em' }}>
          {cases.cases && cases.cases.length > 0 && cases.cases.map(instance => (
            <List.Item as={Card} key={instance.id}>
              <Card.Content>
                <h3><Link to={'/cases/' + instance.id}>{instance.short_name} ({instance.decision_date})</Link></h3>
                <p>{instance.content}</p>
              </Card.Content>
            </List.Item>
          ))}
        </List>
      </Segment>
    );
  }

  _getInnerHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = CaseHome;
