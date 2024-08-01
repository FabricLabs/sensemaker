'use strict';

require('@babel/register');

const React = require('react');
const ReactDOM = require('react-dom');
const ReactDOMServer = require('react-dom/server');

// Settings
const settings = require('../settings/local');

// Fabric HTTP Types
// const Site = require('@fabric/http/types/site');

// Types
const Compiler = require('../types/compiler');

// Components
const JeevesUI = require('../components/JeevesUI');

// Program Body
async function main (input = {}) {
  const site = new JeevesUI(input);
  const compiler = new Compiler({
    document: site,
    webpack: {
      mode: settings.mode || 'development',
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
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
