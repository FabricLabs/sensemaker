'use strict';

// Dependencies
import React from 'react';

// Styles
import '../styles/sensemaker.css'

// TODO: inherit from @fabric/http/types/component
class Sensemaker extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({

    }, settings);

    this._state = {
      content: {}
    };

    return this;
  }

  // TODO: inherit from Actor
  get state () {
    return JSON.parse(JSON.stringify(this.state));
  }

  componentDidMount () {

  }

  render (format = 'html') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.state);
      case 'html':
        return this._renderForReact();
    }
  }

  _renderForReact () {
    return (
      <fabric-content-page>
        <Segment>
          <Header>
            <h1>@sensemaker</h1>
            <p>{this.props.state.message}</p>
          </Header>
        </Segment>
        <Bridge authority="http://localhost:9999" path="/" channels={[
          'bitcoin'
        ]} />
      </fabric-content-page>
    );
  }
}

export default Sensemaker;
