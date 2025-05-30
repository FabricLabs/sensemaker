'use strict';

const React = require('react');
const marked = require('marked');
const merge = require('lodash.merge');

class MarkdownContent extends React.Component {
  constructor(props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED'
      }
    }, props);

    this.state = this.settings.state;
    this._state = {
      content: this.state
    };

    return this;
  }

  componentDidMount () {
    this.setState({ status: 'READY' });
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.content !== this.state.content) {
      this.setState({ content: this.state.content });
    }
  }

  componentWillUnmount () {
    this.setState({ status: 'UNMOUNTED' });
  }

  setContent (content) {
    this.setState({ content });
  }

  getContent () {
    return this.state.content;
  }

  render () {
    return (
      <fabric-markdown-content>
        <style>
          {`
            code {
              display: none;
            }
          `}
        </style>
        <div><code><pre>{this.state.content}</pre></code></div>
        <div dangerouslySetInnerHTML={{ __html: marked.parse(this.state.content || '') }} />
      </fabric-markdown-content>
    );
  }
}

module.exports = MarkdownContent;