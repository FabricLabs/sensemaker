/**
 * Preload script for Electron
 * Provides secure communication between renderer and main processes
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('sensemaker', {
  // Query the sensemaker service
  query: async (query) => {
    return await ipcRenderer.invoke('sensemaker:query', query);
  },

  // Get app information
  getAppInfo: async () => {
    return await ipcRenderer.invoke('app:getInfo');
  },

  // Listen to events from main process
  on: (channel, callback) => {
    const validChannels = [
      'sensemaker:ready',
      'sensemaker:log',
      'sensemaker:error',
      'sensemaker:data'
    ];
    
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    
    console.warn(`Invalid channel: ${channel}`);
    return () => {}; // Return no-op function
  },

  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    const validChannels = [
      'sensemaker:ready',
      'sensemaker:log',
      'sensemaker:error',
      'sensemaker:data'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});

// Expose safe Node.js APIs
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
}); 