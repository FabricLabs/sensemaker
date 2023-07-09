const React = require('react');

class Conversations extends React.Component {
  componentDidMount() {
    this.props.fetchConversations();
  }

  render() {
    const { loading, error, conversations } = this.props;

    console.log('props:', this.props);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <div>
        <h2>Conversations</h2>
        {conversations && conversations.length > 0 && conversations.map(conversation => (
          <div key={conversation.id}>
            <h3>{conversation.title}</h3>
            <p>{conversation.content}</p>
          </div>
        ))}
      </div>
    );
  }
}

module.exports = Conversations;
