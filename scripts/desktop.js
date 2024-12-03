'use strict';

const settings = require('../settings/local');

const { app, protocol, BrowserWindow } = require('electron');
const path = require('path');

// Sensemaker
const Sensemaker = require('../services/sensemaker');

async function createInstance () {
  const sensemaker = new Sensemaker(settings);
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  sensemaker.on('debug', (message) => {
    // console.debug('[DESKTOP]', '[SENSEMAKER]', 'Debug:', message);
  });

  sensemaker.on('log', (message) => {
    // console.log('[DESKTOP]', '[SENSEMAKER]', message);
  });

  sensemaker.on('ready', () => {
    console.log('[DESKTOP] Sensemaker is ready.');
  });

  sensemaker.start().catch((exception) => {
    console.error('Exception:', exception);
  }).then((instance) => {
    console.debug('Sensemaker started.  Configuration ID:', instance.id);
    window.loadFile('assets/index.html');
  });

  return {
    sensemaker,
    window
  };
}

app.on('ready', () => {
  protocol.interceptFileProtocol('file', (request, callback) => {
    const url = request.url.substr(7);
    callback({ path: path.normalize(`./${url}`)})
  });

  createInstance();
});
