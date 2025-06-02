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
    const { request, context, chat } = this.props;
    const prevContext = prevProps.context;

    // Check if context changed meaningfully
    const hasContext = context && Object.keys(context).length > 0;
    const hadContext = prevContext && Object.keys(prevContext).length > 0;

    // Check if we already have a response
    const hasResponse = chat?.response?.choices?.length > 0;

    // Fetch response if:
    // 1. We didn't have context before but now we do
    // 2. Context data has changed
    // 3. AND we don't already have a response
    if (!hasResponse && ((!hadContext && hasContext) || (JSON.stringify(prevContext) !== JSON.stringify(context)))) {
      this.props.fetchResponse(request);
    }
  }

  render () {
    const { network, chat } = this.props;
    const response = chat?.response?.choices?.[0]?.message;
    return (
      <Segment className='fade-in' loading={network?.loading}>
        {(chat?.loading || !response || !response.choices) ? <h3>{BRAND_NAME} is thinking...</h3> : (
          <sensemaker-response>
            <h3>{BRAND_NAME} says...</h3>
            <div dangerouslySetInnerHTML={{ __html: marked.parse((response) ? response.content : '') }}></div>
            <ChatBox
              {...this.props}
              context={{
                ...this.props.context,
                message: response
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
