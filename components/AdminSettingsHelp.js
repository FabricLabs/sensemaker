'use strict';

const React = require('react');

const {
  Menu,
  Icon,
  Button,
  Table,
  Message,
  Header,
  Segment,
  Input,
  Modal
} = require('semantic-ui-react');

class AdminHelp extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      conversation_id: null,
      displayChat: false,
    };
  }

  componentDidMount() {
    this.props.fetchAdminHelpConversations();
  }

  componentDidUpdate(prevProps) {

  };

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  openConversation = (id) => {
    this.setState({ displayChat: true, conversationID: id });
  }

  render() {
    const { conversation_id } = this.state;
    const { help } = this.props;

    return (
      <Segment>
        {(help && help.conversations && help.conversations.length > 0) ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Menu loading={help.loading} vertical fluid >
              {help.conversations.map((instance) => (
                <Menu.Item
                  key={instance.id}
                  onClick={() => this.openConversation(instance.id)}
                  style={{ display: 'flex', flexDirection: 'row', gap: '1em', alignItems: 'center' }}
                >
                  <Icon name='mail outline' size='big' />
                  <p>Conversation from {this.formatDateTime(instance.created_at)}</p>
                </Menu.Item>
              ))}
            </Menu>
          </div>
        ) : (
          <h5>You dont have any conversation yet</h5>
        )}
      </Segment>
    );
  };
}


module.exports = AdminHelp;
