'use strict';

import toRelativeTime from '../functions/toRelativeTime';

// Constants
const { BRAND_NAME } = require('../constants');

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const marked = require('marked');

// Components
// Semantic UI
const {
  Segment,
  Button,
  Modal,
  Icon
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
      },
      isRegenerateModalOpen: false,
      isRegenerating: false,
      originalRequest: null
    };

    this.handleRegenerateClick = this.handleRegenerateClick.bind(this);
    this.handleRegenerateConfirm = this.handleRegenerateConfirm.bind(this);
    this.handleRegenerateCancel = this.handleRegenerateCancel.bind(this);
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

    // Store the original request when it's first provided (for regeneration)
    if (request && !this.state.originalRequest) {
      this.setState({ originalRequest: request });
    }

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

    // Reset isRegenerating when new content arrives
    if (this.state.isRegenerating) {
      // Reset regenerating state if we got new initial content or a new response
      if ((hasInitialContent && initialContent !== prevProps.initialContent) ||
          (hasResponse && !hadResponse)) {
        this.setState({ isRegenerating: false });
      }
    }

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

  handleRegenerateClick () {
    this.setState({ isRegenerateModalOpen: true });
  }

  handleRegenerateConfirm () {
    this.setState({ 
      isRegenerateModalOpen: false, 
      isRegenerating: true 
    });

    // Use the original request that was stored when first provided
    const requestToSend = this.props.request || this.state.originalRequest;

    // Directly trigger the new request
    if (requestToSend && !this._isUnmounted && this.props.fetchResponse) {
      console.debug('Regenerate: requestToSend', requestToSend);
      console.debug('Regenerate: context', this.props.context);
      this.props.fetchResponse({
        ...requestToSend,
        context: this.props.context,
        timestamp: Date.now()
      });
    }
  }

  handleRegenerateCancel () {
    this.setState({ isRegenerateModalOpen: false });
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
    const isLoading = network?.loading || chat?.loading;

    // Hide content if we're regenerating
    const showContent = hasContent && !this.state.isRegenerating;
    const timestamp = response?.created || new Date().toISOString();

    return (
      <Segment className='fade-in' loading={isLoading}>
        {(!showContent || isLoading) ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{BRAND_NAME} is thinking...</h3>
            <Icon name='spinner' loading />
          </div>
        ) : (
          <sensemaker-response>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ marginBottom: 0 }}>{BRAND_NAME} says...</h3>
                <abbr title={timestamp}>{toRelativeTime(timestamp)}</abbr>
              </div>
              <Button
                icon
                basic
                size='small'
                onClick={this.handleRegenerateClick}
                title="Regenerate response"
              >
                <Icon name='refresh' />
              </Button>
            </div>
            <div style={{ marginTop: '1em' }} dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }}></div>
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
              hideContext={this.props.hideContext}
            />
            <Modal
              size='tiny'
              open={this.state.isRegenerateModalOpen}
              onClose={this.handleRegenerateCancel}
            >
              <Modal.Header>Regenerate Response</Modal.Header>
              <Modal.Content>
                <p>Are you sure you want to regenerate this response?  The current response will be replaced.</p>
              </Modal.Content>
              <Modal.Actions>
                <Button negative onClick={this.handleRegenerateCancel}>
                  Cancel
                </Button>
                <Button positive onClick={this.handleRegenerateConfirm}>
                  Regenerate
                </Button>
              </Modal.Actions>
            </Modal>
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
