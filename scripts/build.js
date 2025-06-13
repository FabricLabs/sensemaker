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
const webpack = require('webpack');

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
  try {
    const mode = input.mode || 'development';
    const site = new SensemakerUI(input);
    const webpackConfig = {
      mode: mode,
      stats: {
        colors: true,
        modules: true,
        reasons: true,
        errorDetails: true
      },
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
    };

    console.log('[BUILD] Initializing bundler...');
    const compiler = new Bundler({
      document: site,
      webpack: webpackConfig,
      mode: mode,
      ...input
    });

    console.log('[BUILD] Starting compilation...');
    const compilationResults = await compiler.compileTo('assets/index.html');

    // Display enhanced compilation results
    if (compilationResults.html && compilationResults.html.success) {
      console.log('[BUILD] HTML compilation complete.');
    } else {
      console.error('[BUILD] HTML compilation failed.');
    }

    if (compilationResults.bundle) {
      console.log(`[BUILD] JavaScript bundle compiled successfully:`);
      console.log(`[BUILD] Bundle (${compilationResults.bundle.type}):`);
      console.log(`[BUILD]   Size: ${compilationResults.bundle.size} bytes`);
      console.log(`[BUILD]   Hash: ${compilationResults.bundle.hash}`);
      console.log(`[BUILD]   Path: ${compilationResults.bundle.path}`);
      console.log(`[BUILD]   Last Modified: ${compilationResults.bundle.lastModified}`);
    }

    if (compilationResults.webpack && compilationResults.webpack.compilation) {
      const assets = compilationResults.webpack.compilation.assets;
      if (assets && Object.keys(assets).length > 0) {
        console.log('[BUILD] Webpack assets generated:');
        Object.entries(assets).forEach(([name, asset]) => {
          console.log(`[BUILD]   ${name}: ${asset.size} bytes`);
        });
      }
    }

    // Automatically generate cache.manifest for offline support
    console.log('[BUILD] Generating cache manifest...');
    await compiler.generateCacheManifest();

    return {
      site: site.id,
      mode: mode,
      success: true,
      compilation: Object.keys(compilationResults)
    };
  } catch (error) {
    console.error('\n[BUILD] Build failed with error:');
    console.error(error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run Program
console.log('[BUILD] Starting build process...');
main(settings).catch((exception) => {
  console.error('\n[BUILD] Unhandled exception in build process:');
  console.error(exception);
  if (exception.stack) {
    console.error('\nStack trace:');
    console.error(exception.stack);
  }
  process.exit(1);
}).then((output) => {
  if (output && output.success) {
    console.log('\n[BUILD] Build completed successfully!');
    console.log('[BUILD] Output:', output);
  }
});
