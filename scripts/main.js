'use strict';

const settings = require('../settings/local');

const { app, protocol, BrowserWindow } = require('electron');
const path = require('path');

const Sensemaker = require('../services/jeeves');

function createInstance () {
  const sensemaker = new Sensemaker(settings);
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  sensemaker.on('debug', (message) => {
    console.debug('[DESKTOP]', '[SENSEMAKER]', 'Debug:', message);
  });

  sensemaker.on('log', (message) => {
    console.log('[DESKTOP]', '[SENSEMAKER]', message);
  });

  sensemaker.on('ready', () => {
    console.log('[DESKTOP] Sensemaker is ready.');
  });

  sensemaker.start();

  window.loadFile('assets/index.html');

  return {
    sensemaker,
    window
  };
}

app.whenReady().then(() => {
  protocol.interceptFileProtocol('file', (request, callback) => {
    const url = request.url.substr(7);
    console.debug('url:', url);
    if (url.startsWith('bundles') ||
        url.startsWith('styles') ||
        url.startsWith('scripts') ||
        url.startsWith('images') ||
        url.startsWith('fonts') ||
        url.startsWith('semantic')
     ) {
      const norm = path.normalize(`https://trynovo.com/${url}`);
      console.debug('norm:', norm);
      callback({ path: norm });
    } else {
      callback({ path: `${url}` });
    }
  });

  createInstance();
});
