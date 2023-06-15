'use strict';

const React = require('react');

// Fabric HTTP Types
const Site = require('@fabric/http/types/site');

// Styles
// import '../styles/jeeves.css'

// TODO: inherit from @fabric/http/types/component
class JeevesUI extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      domain: 'jeeves.dev',
      handle: `jeeves-application`
    }, settings);

    this._state = {
      content: {
        message: 'Hello, Jeeves!'
      }
    };

    return this;
  }

  get handle () {
    return this.settings.handle;
  }

  get id () {
    return require('crypto').randomBytes(32).toString('hex');
  }

  get permalink () {
    return `https://${this.settings.domain}`;
  }

  get state () {
    return JSON.parse(JSON.stringify(this._state.content));
  }

  /* componentDidMount () {
    console.log('sensemaker mounted');
  } */

  render () {
    return (
      <div>
        <h1>{this.state.message}</h1>
      </div>
    );
  }

  _getHTML () {
    return `
      <${this.handle} id="${this.id}" class="fabric-site">
        <link href="/styles/semantic.css" rel="stylesheet" type="text/css" />
        <link href="/styles/screen.css" rel="stylesheet" type="text/css" />
        <fabric-container id="react-application"></fabric-container>
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
        <script src="/bundles/browser.js"></script>
      </${this.handle}>
    `.trim();
  }
}

module.exports = JeevesUI;
