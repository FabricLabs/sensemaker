'use strict';

const { ipcRenderer } = require('electron');
const isDev = require('electron-is-dev');
const ipc = require('node-ipc');
const { v1, v3, v4, v5, v6, v7, NIL, MAX, parse, stringify, validate, version } = require('uuid');

let resolveSocketPromise = null;
let socketPromise = new Promise(resolve => {
  resolveSocketPromise = resolve
});

window.IS_DEV = isDev;

window.getServerSocket = () => {
  return socketPromise
};

ipcRenderer.on('set-socket', (event, { name }) => {
  resolveSocketPromise(name)
});

window.ipcConnect = (id, func) => {
  ipc.config.silent = true
  ipc.connectTo(id, () => {
    func(ipc.of[id])
  })
};

// Recreate UUID object structure for backward compatibility
window.uuid = { v1, v3, v4, v5, v6, v7, NIL, MAX, parse, stringify, validate, version };
