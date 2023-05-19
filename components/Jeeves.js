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
      domain: 'jeeves.dev',
      handle: `jeeves-application`
    }, settings);

    this._state = {
      content: {}
    };

    return this;
  }

  get permalink () {
    return `https://${this.settings.domain}`;
  }

  componentDidMount () {
    console.log('sensemaker mounted');
  }

  _getHTML () {
    return `
      <${this.handle} id="${this.id}" class="fabric-site">
        <fabric-container class="ui primary action fluid text container">
          <fabric-card class="ui fluid card">
            <fabric-card-content class="center aligned content">
              <img src="/images/jeeves-brand.png" class="ui image" />
              <h1>JEEVES</h1>
              <p><code>alpha</code></p>
              <p class="supersize"><em>coming soon</em></p>
            </fabric-card-content>
            <fabric-card-content class="extra content">
              <a href="${this.permalink}" class="ui left labeled icon button clipped">
                <i class="linkify icon"></i>
                <abbr title="sha256: ${this.id}"><code data-bind="hash">${this.id}</code></abbr>
              </a>
            </fabric-card-content>
          </fabric-card>
        </fabric-container>
      </${this.handle}>
    `.trim();
  }
}

module.exports = JeevesUI;
