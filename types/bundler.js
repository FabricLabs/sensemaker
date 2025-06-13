'use strict';

// Dependencies
const path = require('path');
const crypto = require('crypto');
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

    this.packer = webpack(this.settings.webpack || {});

    return this;
  }

  /**
   * Compile the JavaScript bundle using webpack.
   * @returns {Promise<Object>} Webpack compilation results
   */
  async compileJavaScriptBundle () {
    console.log('[BUNDLER] Compiling JavaScript bundle...');
    return new Promise((resolve, reject) => {
      this.packer.run((err, stats) => {
        if (err) {
          console.error('[BUNDLER] Webpack compilation error:', err);
          return reject(err);
        }

        if (stats.hasErrors()) {
          const errors = stats.toJson().errors;
          console.error('[BUNDLER] Webpack compilation errors:', errors);
          return reject(new Error(`Webpack compilation failed: ${errors.join(', ')}`));
        }

        if (stats.hasWarnings()) {
          const warnings = stats.toJson().warnings;
          console.warn('[BUNDLER] Webpack compilation warnings:', warnings);
        }

        console.log('[BUNDLER] JavaScript bundle compiled successfully');
        resolve(stats);
      });
    });
  }

  /**
   * Calculate the sha256 hash of the generated JavaScript bundle.
   * @param {string} bundlePath Path to the bundle file
   * @returns {string} SHA256 hash of the bundle
   */
  calculateBundleHash (bundlePath) {
    if (!bundlePath) {
      const mode = this.settings.webpack?.mode || 'development';
      const filename = mode === 'production' ? 'browser.min.js' : 'browser.js';
      bundlePath = path.resolve(`./assets/bundles/${filename}`);
    }

    try {
      const bundleContent = fs.readFileSync(bundlePath);
      const hash = crypto.createHash('sha256').update(bundleContent).digest('hex');
      console.log(`[BUNDLER] JavaScript bundle hash: ${hash}`);
      return hash;
    } catch (error) {
      console.error('[BUNDLER] Error calculating bundle hash:', error);
      return null;
    }
  }

  /**
   * Get bundle statistics.
   * @returns {Object} Bundle statistics
   */
  getBundleStats () {
    const mode = this.settings.webpack?.mode || 'production';
    const isDevelopment = mode === 'development';
    const bundlePath = path.resolve(`./assets/bundles/${isDevelopment ? 'browser.js' : 'browser.min.js'}`);
    const getFileStats = (filePath) => {
      try {
        const stats = fs.statSync(filePath);
        const hash = this.calculateBundleHash(filePath);
        return {
          path: filePath,
          size: stats.size,
          hash: hash,
          lastModified: stats.mtime,
          type: isDevelopment ? 'unminified' : 'minified'
        };
      } catch (error) {
        console.warn(`[BUNDLER] Could not get stats for ${path.basename(filePath)}:`, error.message);
        return null;
      }
    };

    const bundleStats = getFileStats(bundlePath);
    return bundleStats;
  }

  /**
   * Enhanced compilation method that compiles both HTML and JavaScript bundle.
   * @param {string} target Path to output HTML file
   * @returns {Promise<Object>} Compilation results including bundle hash
   */
  async compileTo (target = 'assets/index.html') {
    try {
      console.log('[BUNDLER] HTML compilation process...');
      const webpackStats = await this.compileJavaScriptBundle();
      const bundleStats = this.getBundleStats();
      const htmlSuccess = await super.compileTo(target);
      const results = {
        html: {
          target: target,
          success: htmlSuccess
        },
        bundle: bundleStats,
        webpack: {
          compilation: webpackStats.toJson({
            assets: true,
            chunks: false,
            modules: false,
            source: false,
            errorDetails: false,
            timings: true
          })
        },
        timestamp: new Date().toISOString()
      };

      console.log('[BUNDLER] HTML compilation completed successfully');
      console.log('[BUNDLER] Bundle size:', bundleStats?.size, 'bytes');
      console.log('[BUNDLER] Bundle hash:', bundleStats?.hash);

      return results;
    } catch (error) {
      console.error('[BUNDLER] HTML compilation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a cache.manifest file listing all static assets for offline support.
   * @param {string} outputPath Path to the manifest file (default: 'assets/cache.manifest')
   */
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
