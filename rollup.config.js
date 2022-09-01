/**
 * # Sample Rollup for Fabric
 */
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import css from 'rollup-plugin-import-css';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';

const plugins = [
  resolve({
    extensions: ['.js']
  }),
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }),
  css(),
  json(),
  url(),
  babel({
    presets: ['@babel/preset-react'],
    babelHelpers: 'runtime',
    skipPreflightCheck: true,
    exclude: '**/node_modules/**',
  }),
  commonjs({
    include: 'node_modules/**'
  })
];

function handleWarning (warning, warn) {
  const { code, importer } = warning;
  if (code === 'CIRCULAR_DEPENDENCY' && importer.includes('semantic-ui-react')) return;
  warn(warning);
}

const builds = [
  {
    input: 'scripts/browser.js',
    output: [
      {
        file: 'assets/sensemaker.js',
        format: 'iife',
        name: 'PortalFeedMonitor',
        globals: {
          'buffer': 'buffer',
          'crypto': 'crypto',
          'querystring': 'querystring',
          'stream': 'stream',
          'url': 'url',
          'punycode': 'punycode',
          'zlib': 'zlib',
          'events': 'events',
          'net': 'net',
          'tls': 'tls',
          'stream': 'stream',
          'lodash.merge': 'merge',
          'https': 'https',
          'react': 'React',
          'react-dom': 'ReactDOM',
          'semantic-ui-react': 'semanticUIReact',
          'bip39': 'bip39',
          'trezor-connect': 'TrezorConnect'
        },
      }
    ],
    plugins: plugins,
    onwarn: handleWarning
  }
];

export default builds;
