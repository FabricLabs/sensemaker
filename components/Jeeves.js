'use strict';

// Fabric HTTP Types
const Site = require('@fabric/http/types/site');

// Styles
// import '../styles/jeeves.css'

// TODO: inherit from @fabric/http/types/component
class JeevesUI extends Site {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      handle: `jeeves-application`
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
      <${this.handle} id="${this.id}">
        <fabric-card class="ui card">
          <fabric-card-content class="content">
            <h1>JEEVES</h1>
            <p><code>alpha</code></p>
          </fabric-card-content>
        </fabric-card>
      </${this.handle}>
    `.trim();
  }
}

module.exports = JeevesUI;
