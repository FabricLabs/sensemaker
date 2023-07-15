'use strict';

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

class Conversation extends React.Component {
  componentDidMount () {
    const { id } = this.props;
    console.log('conversation id:', id);
    this.props.fetchConversation(id);
  }

  render () {
    const { loading, error, room } = this.props;

    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <div>
        <h2>Room</h2>
        <code>{room}</code>
        <code>{room?.log}</code>
        {room && room.messages && room.messages.length > 0 && room.messages.map(message => (
          <div key={message.id}>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
    );
  }
}

function Chat (props) {
  const { id } = useParams();
  return <Conversation id={id} {...props} />;
}

module.exports = Chat;
