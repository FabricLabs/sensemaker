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
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" charset="utf-8" />
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta property="og:url" content="http://trynovo.com">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Novo · Your Legal Assistant">
    <meta property="og:description" content="Draft impeccable arguments with Novo, the legal AI.">
    <meta property="og:image" content="https://trynovo.com/images/novo-cat-white.png">
    <title>${this.title || this.settings.title}</title>
    <!-- <link rel="manifest" href="/manifest.json"> -->
    <link rel="stylesheet" type="text/css" href="/semantic.min.css" />
    <link rel="stylesheet" type="text/css" href="/styles/screen.css" />
    <link rel="stylesheet" type="text/css" href="/styles/styles.css" />
    <link rel="stylesheet" type="text/css" href="/styles/ReactToastify.css">
    <script src="/scripts/jquery-3.4.1.js"></script>
    <script src="/semantic.min.js"></script>
    <link rel="icon" href="/images/favicon.svg" />
  </head>
  <body>
    <div data-hash="${hash}" id="application-target">${html}</div>
    <script src="/bundles/browser.min.js"></script>
  </body>
</html>`;
  }
}

module.exports = SPA;
