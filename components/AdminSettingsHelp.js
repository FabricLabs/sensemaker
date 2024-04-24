'use strict';

const React = require('react');

const {
  Menu,
  Icon,
  Button,
  Table,
  Message,  
  Segment,
  Input,
  Header,
  Modal
} = require('semantic-ui-react');

const AdminHelpChat = require('./AdminHelpChat');

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
    const { help } = this.props;
    if (prevProps.help != help) {
      console.log("the help state", help);
    }

  };

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  openConversation = (id) => {
    console.log("conversation clicked:", id);
    this.setState({ displayChat: true, conversation_id: id });
  }

  render() {
    const { conversation_id, displayChat } = this.state;
    const { help } = this.props;

    return (
      <section>
        <Header as='h3' style={{marginTop: '2em'}}>User Assistance</Header>
        <Segment style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '60vh', gap: '1em' }}>
          {(help && help.conversations && help.conversations.length > 0) ? (
            <div style={{ flex: 1, overflowY: 'auto', width: '50%', maxHeight: '55vh', padding: '0', marginBottom: '0' }}>
              <Menu loading={help.loading} vertical fluid >
                {help.conversations.map((instance) => (
                  <Menu.Item
                    key={instance.id}
                    onClick={() => this.openConversation(instance.id)}
                    style={{ display: 'flex', flexDirection: 'row', gap: '2em', alignItems: 'center' }}
                  >
                    <Icon name='mail outline' size='big' />
                    <div>
                      <p>Conversation from {this.formatDateTime(instance.created_at)}</p>
                      <p>Username: <span style={{ color: '#336699' }}>{instance.creator_username}</span>
                        - ID: <span style={{ color: '#336699' }}>{instance.creator_id}</span>
                        - Name: <span style={{ color: '#336699' }}>{instance.creator_first_name}</span>
                      </p>
                    </div>
                  </Menu.Item>
                ))}
              </Menu>
            </div>
          ) : (
            <h5>You dont have any conversation yet</h5>
          )}
          <div style={{ flex: 1, overflowY: 'auto', width: '50%', height: '100%', maxHeight: '55vh' }}>
            {displayChat &&
              <AdminHelpChat {...this.props} conversationID={conversation_id} />
            }
          </div>
        </Segment>
      </section>
    );
  };
}


module.exports = AdminHelp;
