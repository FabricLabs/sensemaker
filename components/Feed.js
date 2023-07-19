'use strict';

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');
const marked = require('marked');

const {
  Card,
  Feed,
  Form,
  Header,
  Image,
  Input,
  Search
} = require('semantic-ui-react');

class ActivityFeed extends React.Component {
  render () {
    const { loading, error, chat, messages } = this.props;

    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    return (
      <Feed>
        {chat && chat.messages && chat.messages.length > 0 && chat.messages.map(message => (
          <Feed.Event key={message.id}>
            <Feed.Content>
              <Feed.Summary>
                <Feed.User>{message.author}</Feed.User>
                <Feed.Date><abbr title={message.created_at}>{message.created_at}</abbr></Feed.Date>
              </Feed.Summary>
              <Feed.Extra text>
                <span dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} />
              </Feed.Extra>
            </Feed.Content>
          </Feed.Event>
        ))}
      </Feed>
    );
  }
}

function WrappedFeed (props) {
  const { id } = useParams();
  return <ActivityFeed id={id} {...props} />;
}

module.exports = WrappedFeed;
