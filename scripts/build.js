'use strict';

require('@babel/register')({
  ignore: [
    function (filepath) {
      return /node_modules/.test(filepath) && !/node_modules[\\/]+@fabric[\\/]hub/.test(filepath);
    }
  ],
  presets: ['@babel/preset-env', '@babel/preset-react']
});

const React = require('react');
const ReactDOM = require('react-dom');
const ReactDOMServer = require('react-dom/server');

// Settings
const settings = require('../settings/local');

// Fabric HTTP Types
// const Site = require('@fabric/http/types/site');

// Types
const Bundler = require('../types/bundler');

// Components
const SensemakerUI = require('../components/SensemakerUI');

// Program Body
async function main (input = {}) {
  const mode = input.mode || 'development';
  const site = new SensemakerUI(input);
  const compiler = new Bundler({
    document: site,
    webpack: {
      mode: mode,
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules\/(?!@fabric\/hub)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env', '@babel/preset-react']
              }
            }
          },
          {
            test: /\.css$/,
            use: [
              { loader: 'style-loader' },
              { loader: 'css-loader' }
            ]
          }
        ]
      },
      target: 'web'
    },
    ...input
  });

  await compiler.compileTo('assets/index.html');

  // Automatically generate cache.manifest for offline support
  await compiler.generateCacheManifest();

  return {
    site: site.id
  };
}

// Run Program
main(settings).catch((exception) => {
  console.error('[BUILD:SITE]', '[EXCEPTION]', exception);
}).then((output) => {
  console.log('[BUILD:SITE]', '[OUTPUT]', output);
});
