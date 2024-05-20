'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Segment,
  Button,
  Icon,
  Menu,
  Label
} = require('semantic-ui-react');
const HelpChat = require('./HelpChat');


class HelpConversations extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      open: true,
      // messageQuery: '',
      conversationID: null,
      displayChat: false,
    };
  }

  componentDidMount() {
    this.props.fetchHelpConversations();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.help != this.props.help) {
      // console.log(this.props.help);
    }
  }

  openConversation = (id) => {
    if (id === 0) {
      this.props.clearHelpMessages();
    }
    this.setState({ displayChat: true, conversationID: id });
    this.props.markMessagesRead(id, 'admin');
  }

  formatDateTime(dateTimeStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  closeHelpChat = () => {
    this.setState({ displayChat: false, conversationID: null });
    this.props.fetchHelpConversations();
  }

  render() {
    const { displayChat } = this.state;
    const { help } = this.props;

    return (
      <Segment fluid
        style={{ width: '100%', height: '100%', color: 'black' }}
      >
        {!displayChat ? (
          <section className='col-center' style={{ width: '100%', height: '100%' }}>
            {(help && help.conversations && help.conversations.length > 0) ? (
              <div style={{ flex: 1, overflowY: 'auto', width: '100%', maxWidth: '100%' }}>
                <Menu vertical fluid id='help-conversations' >
                  {help.conversations.map((instance) => (
                    <Menu.Item
                      key={instance.id}
                      onClick={() => this.openConversation(instance.id)}
                      style={{ display: 'flex', flexDirection: 'row', gap: '1em', alignItems: 'center' }}
                    >
                      {/* <Icon name='mail outline' size='big' /> */}
                      <Icon
                        size='big'
                        name={
                          (instance.last_message.help_role === 'admin' && instance.last_message.is_read === 1) ||
                            instance.last_message.help_role === 'user' ? 'envelope open outline' : 'envelope'
                        }
                        color={
                          (instance.last_message.help_role === 'admin' && instance.last_message.is_read === 1) ||
                            instance.last_message.help_role === 'user' ? 'grey' : undefined
                        }
                      />
                      <div style={{ maxWidth: '70%' }}>
                        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{instance.last_message.content}</p>
                        {/* <p>{instance.last_message.content}</p> */}
                        <p style={{ fontStyle: 'italic', fontSize: '0.8em' }}>{this.formatDateTime(instance.last_message.created_at)}</p>
                      </div>
                    </Menu.Item>
                  ))}
                </Menu>
              </div>
            ) : (
              <h5>You dont have any conversation yet</h5>
            )}
            <Button primary content='Chat with an assistant' style={{ flex: '0 0 auto', marginTop: '1em' }} onClick={() => this.openConversation(0)} />
          </section>
        )
          : (
            <HelpChat
              fetchHelpMessages={this.props.fetchHelpMessages}
              sendHelpMessage={this.props.sendHelpMessage}
              help={this.props.help}
              conversationID={this.state.conversationID}
              closeHelpChat={this.closeHelpChat}
            />
          )
        }


      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = HelpConversations;
