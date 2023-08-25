'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Segment,
  List
} = require('semantic-ui-react');

class CaseHome extends React.Component {
  componentDidMount () {
    this.props.fetchCases();
  }

  render () {
    const { loading, error, cases } = this.props;

    return (
      <Segment fluid>
        <h1>Cases</h1>
        <jeeves-search fluid placeholder='Find...' className="ui disabled search" title='Search is disabled.'>
          <div className="ui icon fluid input">
            <input autoComplete="off" placeholder="Find..." type="text" tabIndex="0" className="prompt" /* value={this.state.search} */ onChange={this.handleSearchChange} />
            <i aria-hidden="true" className="search icon"></i>
          </div>
        </jeeves-search>
        <List>
          {cases.cases && cases.cases.length > 0 && cases.cases.map(instance => (
            <List.Item key={instance.id}>
              <h3><Link to={'/cases/' + instance.id}>{instance.short_name} ({instance.decision_date})</Link></h3>
              <p>{instance.content}</p>
            </List.Item>
          ))}
        </List>
      </Segment>
    );
  }
}

module.exports = CaseHome;
