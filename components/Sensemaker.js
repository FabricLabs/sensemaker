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
      <fabric-site id="fabric-application-root">
        <fabric-sidebar class="ui sidebar">
          <fabric-menu class="ui vertical menu">
            <fabric-menu-item class="item">BRUTAL</fabric-menu-item>
          </fabric-menu>
        </fabric-sidebar>
        <fabric-cards class="ui cards">
          <fabric-card class="ui fluid card">
            <fabric-card-content class="extra content">
              <fabric-button-group class="ui buttons">
                <button class="ui button"><code>STARTED</code></button>
              </fabric-button-group>
            </fabric-card-content>
            <fabric-card-content class="content">
              <h1>@sensemaker</h1>
              <p><code>alpha</code></p>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui fluid card">
            <fabric-card-content class="content">
              <h2>Triggers</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td><code>********</code></td>
                  <td><code>_notifyHoneyPotMonitor</code></td>
                </tr>
                <tr>
                  <td><input type="checkbox" /></td>
                  <td><code>martindale</code></td>
                  <td><code>_notifyMartindale</code></td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Feeds</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td><code>PACER</code></td>
                </tr>
                <tr>
                  <td><input type="checkbox" /></td>
                  <td><code>@twitter/firehose</code></td>
                </tr>
                <tr>
                  <td><input type="checkbox" checked /></td>
                  <td><code>@fabric/dev</code></td>
                </tr>
                <tr>
                  <td><input type="checkbox" checked /></td>
                  <td><code>@fabric/hub</code></td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Agents</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>Jeeves</td>
                  <td>STARTED</td>
                </tr>
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>mjolnir</td>
                  <td>STARTED</td>
                </tr>
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>sensemaker</td>
                  <td>STARTED</td>
                </tr>
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>RPG</td>
                  <td>PAUSED</td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Queues</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>HTTP GET</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Workers</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>worker #1</td>
                  <td><code>PAUSED</code></td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Models</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>jeeves-7b-adaptive</td>
                </tr>
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>alpaca-7b-native-enhanced</td>
                </tr>
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>chatgpt-3.5</td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Pipelines</h2>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Services</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>Matrix</td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Integrations</h2>
              <table class="ui table">
                <tr>
                  <td><input type="checkbox" /></td>
                  <td>OpenAI</td>
                </tr>
              </table>
            </fabric-card-content>
          </fabric-card>
          <fabric-card class="ui card">
            <fabric-card-content class="content">
              <h2>Conversations</h2>
              <table class="ui table"></table>
              <button class="ui right labeled icon button">Create<i class="right chevron icon"></i></button>
            </fabric-card-content>
          </fabric-card>
        </fabric-cards>
      </fabric-site>
    `.trim();
  }
}

module.exports = Sensemaker;
