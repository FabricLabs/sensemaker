 'use strict';

// Fabric Types
const FabricSite = require('@fabric/http/types/site');

// Internal Types
const SPA = require('./spa');

/**
 * Implements a full-capacity (Native + Edge nodes) for a Fabric Site. 
 */
class Site extends FabricSite {
  /**
   * Creates an instance of the {@link Site}, which provides general statistics covering a target Fabric node.
   * @param {Object} [settings] Configuration values for the {@link Site}.
   * @returns {Site} Instance of the {@link Site}.  Call `render(state)` to derive a new DOM element.
   */
  constructor (settings = {}) {
    // Adopt Fabric semantics
    super(settings);

    // Define local settings
    this.settings = Object.assign({
      handle: 'fabric-site',
      authority: 'http://localhost:9332/services/fabric', // loopback service
      fabric: {
        alias: '@sites/default'
      },
      state: {
        title: 'Default Site'
      },
      spa: null
    }, this.settings, settings);

    // Set local state
    this._state = {
      content: this.settings.state,
      status: 'PAUSED'
    };

    // Fabric Components
    this.spa = new SPA(this.settings);
    // this.bridge = new Bridge();

    // Ensure chainability
    return this;
  }

  get handle () {
    return this.settings.handle;
  }

  render (state = this.state) {
    const html = this._getHTML(state);
    return this.spa._renderWith(html);
  }

  toHTML () {
    return this.render();
  }

  _getHTML (state) {
    // TODO: obvious modularization...
    // - fabric-site
    //   - fabric-bridge
    //   - fabric-console
    //   - fabric-menu
    //   - fabric-grid
    return `
      <${this.handle} class="ui container" id="site">
        <fabric-bridge host="localhost" port="9999" secure="false"></fabric-bridge>
        <fabric-console id="console" style="display: none;">
          <fabric-card class="ui fluid card">
            <fabric-card-content class="content">
              <p>Console...</p>
            </fabric-card-content>
          </fabric-card>
        </fabric-console>
        <fabric-menu id="tray">
          <i id="tray-settings" class="ui large inverted cog icon"></i>
        </fabric-menu>
        <fabric-menu>
          <fabric-card id="settings" class="ui fluid card" style="display: none;">
            <fabric-card-header class="ui header">Settings</fabric-card-header>
            <fabric-card-content class="ui content">
              <p>Foo</p>
            </fabric-card-content>
          </fabric-card>
        </fabric-menu>
        <fabric-grid class="ui centered grid">
          <fabric-column class="twelve wide column">
            <fabric-card class="ui fluid card" id="overlay">
              <fabric-card-content class="content" style="text-align: center;">
                <h1 class="ui huge header" data-bind="/title"><code>${state.title || this.title || this.state.title || 'Example Application'}</code></h1>
                <p>file browser</p>
              </fabric-card-content>
              <fabric-card-content class="extra hidden" style="display: none;">
                <h2>Debug</h2>
              </fabric-card-content>
              <fabric-card-content class="bottom attached" style="display: none;">
                <fabric-button-group class="ui small bottom attached left aligned buttons">
                  <fabric-button class="ui labeled icon button"><i class="ui linkify icon"></i> <code>${this.id}</code></fabric-button>
                </fabric-button-group>
              </fabric-card-content>
            </fabric-card>
          </fabric-column>
        </fabric-grid>
      </${this.handle}>
    `.trim();
  }

  _renderWith (html) {
    return this.spa._renderWith(html);
  }

  async start () {
    this.trust(this.peer, 'AGENT');
    await this.peer.start();
    return this;
  }
}

module.exports = Site;
