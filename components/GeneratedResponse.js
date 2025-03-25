'use strict';

// Constants
const { BRAND_NAME } = require('../constants');

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const marked = require('marked');

// Components
// Semantic UI
const {
  Segment
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');

class GeneratedResponse extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
      request: {
        query: 'Introduce yourself.'
      }
    };
  }

  componentDidMount () {
    const { request, context } = this.props;
    // Only fetch response if we have meaningful context data
    if (context && Object.keys(context).length > 0) {
      this.props.fetchResponse(request);
    }
  }

  componentDidUpdate (prevProps) {
    const { request, context } = this.props;
    const prevContext = prevProps.context;

    // Check if context changed meaningfully
    const hasContext = context && Object.keys(context).length > 0;
    const hadContext = prevContext && Object.keys(prevContext).length > 0;

    // Fetch response if:
    // 1. We didn't have context before but now we do
    // 2. Context data has changed
    if ((!hadContext && hasContext) ||
        (JSON.stringify(prevContext) !== JSON.stringify(context))) {
      this.props.fetchResponse(request);
    }
  }

  render () {
    const { network, chat } = this.props;
    return (
      <Segment className='fade-in' loading={network?.loading}>
        {(chat?.loading || !chat.response || !chat.response.choices) ? <h3>{BRAND_NAME} is thinking...</h3> : (
          <sensemaker-response>
            <h3>{BRAND_NAME} says...</h3>
            <div dangerouslySetInnerHTML={{ __html: marked.parse((chat.response) ? chat.response.choices[0].message.content : '') }}></div>
            <ChatBox
              {...this.props}
              context={ this.props.context }
              messagesEndRef={this.messagesEndRef}
              includeFeed={true}
              placeholder={this.props.placeholder || `Your response...`}
              resetInformationSidebar={this.props.resetInformationSidebar}
              messageInfo={this.props.messageInfo}
              thumbsUp={this.props.thumbsUp}
              thumbsDown={this.props.thumbsDown}
            />
          </sensemaker-response>
        )}
      </Segment>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

module.exports = GeneratedResponse;
