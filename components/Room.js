'use strict';

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Card,
  Header,
  Segment
} = require('semantic-ui-react');

const QueryForm = require('./QueryForm');
const Feed = require('./Feed');

class Conversation extends React.Component {
  componentDidMount () {
    const { id } = this.props;
    const { message } = this.props.chat;

    this.props.getMessages({ conversation_id: id });
  }

  render () {
    const { id, loading, error, chat, messages } = this.props;

    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <fabric-container>
        <Segment fluid>
          <Header as='h2'>Conversation #{id}</Header>
          <Feed chat={chat} messages={messages} />
        </Segment>
        {/* <QueryForm chat={chat} conversationID={id} submitMessage={this.props.submitMessage} getMessages={this.props.getMessages} /> */}
      </fabric-container>
    );
  }
}

function Chat (props) {
  const { id } = useParams();
  return <Conversation id={id} {...props} />;
}

module.exports = Chat;
