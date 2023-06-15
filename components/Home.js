const React = require('react');

const {
  Card,
  Header
} = require('semantic-ui-react');

const QueryForm = require('./QueryForm');

module.exports = class JeevesHome extends React.Component {
  render () {
    return (
      <jeeves-home>
        <QueryForm />
        <jeeves-conversations-recent>
          <Header>Recent Conversations</Header>
        </jeeves-conversations-recent>
      </jeeves-home>
    );
  }
}
