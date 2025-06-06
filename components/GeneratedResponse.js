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

    this._isUnmounted = false;
    this.state = {
      context: {},
      loading: false,
      request: {
        query: 'Introduce yourself.'
      }
    };
  }

  componentDidMount () {
    // Context will be set by an outside component after mounting
    // The componentDidUpdate method will handle the initial request
  }

  componentDidUpdate (prevProps) {
    // Don't update if component is unmounted
    if (this._isUnmounted) return;

    const { request, context, chat, network, onResponse, initialContent } = this.props;
    const prevContext = prevProps.context;

    // Check if context changed meaningfully
    const hasContext = context && Object.keys(context).length > 0;
    const hadContext = prevContext && Object.keys(prevContext).length > 0;

    // Check if we already have a response
    const hasResponse = chat?.response?.choices?.length > 0;
    const hadResponse = prevProps.chat?.response?.choices?.length > 0;

    // Check if there's already a request in progress
    const isLoading = network?.loading;

    // Check if we have initial content (existing recommendation)
    const hasInitialContent = initialContent && initialContent.trim() !== '';

    // Fetch response if:
    // 1. We have a valid request object (not null)
    // 2. We don't already have initial content
    // 3. We didn't have context before but now we do, OR context data has changed
    // 4. AND we don't already have a response
    // 5. AND there isn't already a request in progress
    if (request && !hasInitialContent && !isLoading && !hasResponse && ((!hadContext && hasContext) || (JSON.stringify(prevContext) !== JSON.stringify(context)))) {
      this.props.fetchResponse(request);
    }

    // Call onResponse callback when we receive a new response
    if (hasResponse && !hadResponse && onResponse && chat?.response) {
      onResponse(chat.response);
    }
  }

  clearResponse () {
    if (this.props.chat) {
      this.props.chat.response = null;
    }
  }

  componentWillUnmount () {
    // Clear the response so next mount will trigger a new request
    this.clearResponse();
  }

  render () {
    const { network, chat, initialContent } = this.props;
    const response = chat?.response?.choices?.[0]?.message;
    const hasInitialContent = initialContent && initialContent.trim() !== '';
    const content = hasInitialContent ? initialContent : response?.content;
    const hasContent = hasInitialContent || response;

    return (
      <Segment className='fade-in' loading={network?.loading}>
        {(chat?.loading || !hasContent) ? <h3>{BRAND_NAME} is thinking...</h3> : (
          <sensemaker-response>
            <h3>{BRAND_NAME} says...</h3>
            <div dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }}></div>
            <ChatBox
              {...this.props}
              context={{
                ...this.props.context,
                message: response || { content: initialContent }
              }}
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
