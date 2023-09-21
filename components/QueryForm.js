'use strict';

// Dependencies
const React = require('react');
const $ = require('jquery');
const marked = require('marked');

// Semantic UI
const {
  Button,
  Card,
  Feed,
  Form,
  Header,
  Icon,
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

    this.messagesEndRef = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount () {
    $('#primary-query').focus();
    this.props.resetChat();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.chat.messages.length !== this.props.chat.messages.length) {
      this.scrollToBottom();
      // Set hasSubmittedMessage to true if a message has been submitted
      if (!this.state.hasSubmittedMessage) {
        this.setState({ hasSubmittedMessage: true });
      }
    }
  }

  componentWillUnmount () {
    this.props.resetChat();

    this.setState({
      chat: {
        message: null,
        messages: []
      },
      conversations: [],
      message: null,
      messages: []
    });
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }

  handleClick = (e) => {
    console.debug('clicked reset button', e);
    this.props.resetChat();
    this.setState({ message: null, chat: { message: null } });
  }

  handleSubmit = (event) => {
    event.preventDefault();

    const { query } = this.state;
    const { message } = this.props.chat;

    // console.log('handling submit...');

    // console.log('initial message:', message);
    // console.log('initial conversation:', message?.conversation);

    // console.log('handling submit state:', this.state);
    // console.log('handling submit props:', this.props);
    // console.log('handling submit message:', message);

    this.setState({ loading: true });

    // dispatch submitMessage
    this.props.submitMessage({
      conversation_id: message?.conversation,
      content: query
    }).then((output) => {
      // console.log('got output:', output);
      // console.log('getting messages for conversation:', message?.conversation);

      // dispatch getMessages
      this.props.getMessages({ conversation_id: message?.conversation });

      if (!this.watcher) {
        this.watcher = setInterval(() => {
          this.props.getMessages({ conversation_id: message?.conversation });
        }, 15000);
      }

      this.setState({ loading: false });
    });

    // Clear the input after sending the message
    this.setState({ query: '' });
  }

  render () {
    const { loading } = this.state;
    const { isSending, placeholder } = this.props;
    const { message, messages } = this.props.chat;

    // console.log('current state:', this.state);
    // console.log('current props:', this.props);
    // console.log('current message:', message);

    const messageContainerStyle = this.state.hasSubmittedMessage ? {
      flexGrow: 1,
      // overflowY: 'auto',
      // paddingBottom: '1rem',
      transition: 'height 1s'
    } : {
      // height: 0,
      // overflow: 'hidden',
      // transition: 'height 1s'
      paddingBottom: '5em'
    };

    const componentStyle = this.state.hasSubmittedMessage ? {
      // position: 'fixed',
      display: 'block',
      top: '1em',
      left: 'calc(350px + 1em)',
      bottom: '1em',
      right: '1em',
      inset: 0
    } : {
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
    };

    const inputStyle = this.state.hasSubmittedMessage ? {
      position: 'fixed',
      bottom: '1.25em',
      right: '1.25em',
      left: 'calc(350px + 1.25em)'
    } : {
      bottom: '1em',
      right: '1em',
      left: '1em'
    };

    return (
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
        {/* <Button floated='right' onClick={this.handleClick.bind(this)}><Icon name='sync' /></Button> */}
        <Feed style={messageContainerStyle} className='chat-feed'>
          <Feed.Event>
            <Feed.Extra text>
              <Image src='/images/jeeves-brand.png' size='small' floated='left' />
              <div style={{ paddingTop: '5em' }}>
                <p><strong>Hello,</strong> I'm <abbr title="Yes, what about it?">JeevesAI</abbr>, your legal research companion.</p>
              </div>
              <Header style={{ marginTop: '3em' }}>How can I help you today?</Header>
            </Feed.Extra>
          </Feed.Event>
          {this.props.includeFeed && messages && messages.length > 0 && messages.map(message => (
            <Feed.Event key={message.id}>
              <Feed.Content>
                <div style={{ float: 'right', display: 'none' }} className='controls'>
                  <Button.Group size='tiny'>
                    <Button icon='thumbs down' />
                    <Button icon='thumbs up' />
                  </Button.Group>
                </div>
                <Feed.Summary>
                  <Feed.User>{message.author || message.user_id}</Feed.User>
                  <Feed.Date><abbr title={message.created_at}>{message.created_at}</abbr></Feed.Date>
                </Feed.Summary>
                <Feed.Extra text>
                  <span dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} />
                </Feed.Extra>
              </Feed.Content>
            </Feed.Event>
          ))}
        </Feed>
        <Form id="input-controls" size='huge' onSubmit={this.handleSubmit.bind(this)} loading={loading} style={inputStyle}>
          <Form.Field>
            <Form.Input id='primary-query' fluid name='query' required placeholder={placeholder} onChange={this.handleChange} disabled={isSending} loading={isSending} value={this.state.query} />
          </Form.Field>
        </Form>
      </fabric-component>
    );
  }

  scrollToBottom = () => {
    // console.log('scrolling to bottom...');
    // console.log('ref:', this.messagesEndRef);

    if (this.messagesEndRef.current) {
      // console.log('feed:', this.messagesEndRef.current.querySelector('feed'));
      // this.messagesEndRef.current.querySelector('feed').scrollIntoView({ behavior: "smooth" });
    }
  }
}

module.exports = Chat;
