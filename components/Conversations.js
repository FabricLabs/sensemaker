'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Segment
} = require('semantic-ui-react');

class Conversations extends React.Component {
  componentDidMount () {
    this.props.fetchConversations();
  }

  render () {
    const { loading, error, conversations } = this.props;

    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <Segment className='fade-in' fluid style={{ marginRight: '1em' }}>
        <h2>Conversations</h2>
        {conversations && conversations.length > 0 && conversations.map(conversation => (
          <div key={conversation.id}>
            <h3><Link to={'/conversations/' + conversation.id}>{conversation.title}</Link></h3>
            <p>{conversation.content}</p>
          </div>
        ))}
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = Conversations;
