'use strict';

// Dependencies
const crypto = require('crypto');

// Types
const FabricSPA = require('@fabric/http/types/spa');

/**
 * Fully-managed HTML application.
 */
class SPA extends FabricSPA {
  _renderWith (html = '') {
    const hash = crypto.createHash('sha256').update(html).digest('hex');

    // TODO: move CSS to inline from webpack
    return `<!DOCTYPE html>
<html lang="${this.settings.language}"${(this.settings.offline) ? ' manifest="cache.manifest"' : ''}>
  <head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-G4NJT3T2KL"></script>
    <script>
      window.dataLayer = window.dataLayer || [];

      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());

      gtag('config', 'G-G4NJT3T2KL');
    </script>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>${this.title || this.settings.title}</title>
    <!-- <link rel="manifest" href="/manifest.json"> -->
    <link rel="stylesheet" type="text/css" href="/styles/semantic.min.css" />
    <link rel="stylesheet" type="text/css" href="/styles/screen.css" />
    <script src="/scripts/jquery-3.4.1.js"></script>
    <script src="/scripts/semantic.min.js"></script>
    <link rel="icon" href="/images/favicon.ico" />
  </head>
  <body>
    <div data-hash="${hash}" id="application-target">${html}</div>
    <script src="/bundles/browser.min.js"></script>
  </body>
</html>`;
  }
}

module.exports = SPA;
