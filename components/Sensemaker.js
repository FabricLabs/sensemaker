'use strict';

// Fabric HTTP Types
const Site = require('@fabric/http/types/site');

// Styles
// import '../styles/sensemaker.css'

// TODO: inherit from @fabric/http/types/component
class Sensemaker extends Site {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({

    }, settings);

    this._state = {
      content: {}
    };

    return this;
  }

  componentDidMount () {
    console.log('sensemaker mounted');
  }

  _getHTML () {
    return `
      <fabric-site>
        <fabric-card class="ui card">
          <fabric-card-content class="content">
            <h1>@sensemaker</h1>
            <p><code>alpha</code></p>
          </fabric-card-content>
        </fabric-card>
      </fabric-site>
    `.trim();
  }
}

module.exports = Sensemaker;
