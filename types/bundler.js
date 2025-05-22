'use strict';

// Dependencies
const path = require('path');
const merge = require('lodash.merge');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const fs = require('fs');

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
      webpack: {
        mode: 'production',
        entry: path.resolve('./scripts/browser.js'),
        experiments: {
          asyncWebAssembly: true
        },
        resolve: {
          fallback: {
            crypto: path.resolve(__dirname, '../scripts/crypto-shim'),
            ecc: path.resolve(__dirname, '../scripts/ecc-shim'),
            stream: require.resolve('stream-browserify'),
            path: require.resolve('path-browserify'),
            assert: require.resolve('assert-browserify'),
            util: require.resolve('util/'),
            fs: false,
            http: false,
            https: false,
            zlib: false,
            url: false
          },
          symlinks: false
        },
        target: 'web',
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
                  presets: [
                    ['@babel/preset-env', {
                      modules: false,
                      targets: {
                        browsers: ['last 2 versions', 'not dead']
                      }
                    }],
                    '@babel/preset-react'
                  ],
                  plugins: [
                    '@babel/plugin-transform-runtime',
                    '@babel/plugin-transform-modules-commonjs'
                  ]
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
            Buffer: ['buffer', 'Buffer']
          }),
          new BundleAnalyzerPlugin({
            analyzerMode: process.env.ANALYZE ? 'server' : 'disabled',
            openAnalyzer: true
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

  async generateCacheManifest (outputPath = path.resolve('assets/cache.manifest')) {
    function walk(dir, filelist = [], basedir = dir) {
      fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        const relpath = path.relative(basedir, filepath).replace(/\\/g, '/');
        if (fs.statSync(filepath).isDirectory()) {
          walk(filepath, filelist, basedir);
        } else {
          // Exclude the manifest itself
          if (!relpath.endsWith('cache.manifest')) {
            filelist.push(relpath);
          }
        }
      });
      return filelist;
    }
    const assetDir = path.resolve('assets');
    const files = walk(assetDir).map(f => f.startsWith('.') ? f.slice(1) : f);
    const manifest = [
      'CACHE MANIFEST',
      `# Hash: ${Date.now()}`,
      '',
      'CACHE:',
      ...files,
      '',
      'NETWORK:',
      '*',
      '',
      'FALLBACK:',
      ''
    ].join('\n');
    fs.writeFileSync(outputPath, manifest, 'utf8');
    console.log(`[BUNDLER] cache.manifest generated with ${files.length} files.`);
  }

  async generateWebManifest (outputPath = path.resolve('assets/manifest.json')) {
    const manifest = {
      name: this.site.name,
      short_name: this.site.name,
      description: this.site.description || '',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      icons: [
        {
          src: '/assets/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/assets/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`[BUNDLER] manifest.json generated.`);
  }
}

module.exports = Bundler;
