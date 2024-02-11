'use strict';

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Header,
  Segment
} = require('semantic-ui-react');

const ChatBox = require('./ChatBox');

class MatterNewChat extends React.Component {
  constructor (props) {
    super(props);

    this.messagesEndRef = React.createRef();
  }

  componentDidMount () {
    const { id } = this.props;
    const { message } = this.props.chat;

    // this.props.fetchConversation(id);
    this.props.resetChat();
    this.props.fetchMatter(this.props.matterID);
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);

  }
  handleResize = () => {
    // Force a re-render when the window resizes
    this.forceUpdate();
  };

  render () {
    const { id, chat, messages, matterID, matters } = this.props;

    const componentStyle = {
      display: 'absolute',
      top: '1em',
      left: 'calc(350px + 1em)',
      height: 'calc(100vh - 2.5rem)', // Set a maximum height
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '0'
    };

    return (
      <fabric-component ref={this.messagesEndRef} class='ui fluid segment' style={componentStyle}>
           <ChatBox
            {...this.props}
            chat={chat} messages={messages}
            messagesEndRef={this.messagesEndRef}
            includeFeed={true}
            placeholder={'Ask me anything...'}
            matterID={matterID}
            matterTitle={(matters && matters.current && matters.current.title)? matters.current.title : null}
          />
       </fabric-component>
    );
  }
}

function MatterConversation (props) {
  const { matterID } = useParams();
  return <MatterNewChat matterID={matterID} {...props} />;
}

module.exports = MatterConversation;