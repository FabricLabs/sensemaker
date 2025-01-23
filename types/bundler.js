'use strict';

// Dependencies
const path = require('path');
const merge = require('lodash.merge');
const webpack = require('webpack');

// Polyfills
const { JSDOM } = require('jsdom');
const dom = new JSDOM();

// Browser Polyfills
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.HTMLElement;

// Fabric Types
// const Service = require('@fabric/core/types/service');
const HTTPCompiler = require('@fabric/http/types/compiler');
const HTTPComponent = require('@fabric/http/types/component');

// Types
const HTTPSite = require('./site');

/**
 * Builder for {@link Fabric}-based applications.
 */
class Bundler extends HTTPCompiler {
  /**
   * Create an instance of the bundler.
   * @param {Object} [settings] Map of settings.
   * @param {HTTPComponent} [settings.document] Document to use.
   */
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      document: settings.document || new HTTPComponent(settings),
      site: {
        name: 'Default Fabric Application'
      },
      state: {
        title: settings.title || 'Fabric HTTP Document'
      },
      // TODO: load from:
      // 1. webpack.config.js (local)
      // 2. @fabric/http/webpack.config
      webpack: {
        mode: 'production',
        entry: path.resolve('./scripts/browser.js'),
        experiments: {
          asyncWebAssembly: true
        },
        resolve: {
          fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            querystring: require.resolve('querystring-es3'),
            path: require.resolve('path-browserify'),
            assert: require.resolve('assert-browserify'),
            util: require.resolve('node-util'),
            fs: require.resolve('browserify-fs')
          },
          symlinks: false
        },
        target: 'node',
        output: {
          path: path.resolve('./assets/bundles'),
          filename: 'browser.min.js',
          clean: {
            dry: true
          }
        },
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
              use: ['style-loader', 'css-loader']
            }
          ]
        },
        plugins: [
          new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
          }),
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
          })
        ],
        watch: false
      }
    }, settings);

    this.component = this.settings.document || null;
    this.site = new HTTPSite(this.settings.site);

    this._state = {
      content: this.settings.state
    };

    this.packer = webpack(this.settings.webpack);

    return this;
  }
}

module.exports = Bundler;
