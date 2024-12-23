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

class GeneratedResponse extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
      request: {
        query: ''
      }
    };
  }

  componentDidMount () {
    const { request } = this.props;
    // console.debug('GeneratedResponse.componentDidMount', { request });
    this.props.fetchResponse(request);
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const { response, tasks } = this.props;
  }

  render () {
    const { network, chat } = this.props;
    return (
      <Segment className='fade-in' loading={network?.loading}>
        {(chat?.loading) ? <h3>{BRAND_NAME} is thinking...</h3> : (
          <sensemaker-response>
            <h3>{BRAND_NAME} says...</h3>
            <div dangerouslySetInnerHTML={{ __html: marked.parse((chat.response) ? chat.response.choices[0].message.content : '') }}></div>
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
