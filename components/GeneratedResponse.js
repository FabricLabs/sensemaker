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
    this.props.fetchResponse(request);
  }

  componentDidUpdate (prevProps) {
    const { response } = this.props;
    if (prevProps.response !== response) {
      // if (!response.loading) {
      //   this.setState({ loading: false });
      // }
    }
  }

  render () {
    const { network, response } = this.props;
    return (
      <Segment className='fade-in' loading={network?.loading}>
        {(response?.loading) ? <h3>{BRAND_NAME} is thinking...</h3> : (
          <sensemaker-response>
            <h3>{BRAND_NAME} says...</h3>
            <div dangerouslySetInnerHTML={{ __html: marked.parse((response) ? response.choices[0].message.content : '') }}></div>
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
