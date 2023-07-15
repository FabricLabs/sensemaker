'use strict';

const React = require('react');
const $ = require('jquery');
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

class Chat extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      query: '',
      hasSubmittedMessage: false
    };
  }

  messagesEndRef = React.createRef();

  componentDidMount () {
    $('#primary-query').focus();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.chat.messages.length !== this.props.chat.messages.length) {
      this.scrollToBottom();
      if (!this.state.hasSubmittedMessage) {
        this.setState({ hasSubmittedMessage: true });
      }
    }
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { query } = this.state;
    const { message } = this.props.chat;

    this.setState({ loading: true });

    this.props.submitMessage({
      conversation_id: message?.object?.conversation_id,
      content: query
    }).then((output) => {
      this.props.getMessages({ conversation_id: message?.object?.conversation_id });

      if (!this.watcher) {
        this.watcher = setInterval(() => {
          this.props.getMessages({ conversation_id: this.state.chat?.message?.conversation_id });
        }, 1000);
      }

      this.setState({ loading: false });
    });

    this.setState({ query: '' });
  }

  render () {
    const { loading } = this.state;
    const { isSending, placeholder } = this.props;
    const { message, messages } = this.props.chat;

    const messageContainerStyle = this.state.hasSubmittedMessage ? { flexGrow: 1, overflowY: 'auto', paddingBottom: '1rem', transition: 'height 1s' } : { height: 0, overflow: 'hidden', transition: 'height 1s' };

    return (
      <fabric-component class='ui fluid segment' style={{ height: '100vh', display: 'flex', flexDirection: 'column'}}>
        <Image src='/images/jeeves-brand.png' size='small' floated='left' />
        <div style={{ paddingTop: '5em' }}>
          <p><strong>Hello,</strong> I'm <abbr title="Yes, what about it?">JeevesAI</abbr>, your legal research companion.</p>
          <Header>How can I help you today?</Header>
        </div>
        <Feed style={messageContainerStyle}>
          {messages && messages.length > 0 && messages.map(message => (
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
        <Form size='huge' onSubmit={this.handleSubmit} loading={loading}>
          <Form.Field>
            <Form.Input id='primary-query' fluid name='query' placeholder={placeholder} onChange={this.handleChange} disabled={isSending} loading={isSending} value={this.state.query} />
          </Form.Field>
        </Form>
      </fabric-component>
    );
  }

  scrollToBottom = () => {
    if (this.messagesEndRef.current) {
      this.messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }
}

module.exports = Chat;

