'use strict';

const settings = require('../settings/local');

const path = require('path');
const { fork } = require('child_process');
const { app, protocol, BrowserWindow, ipcMain } = require('electron');
const http = require('http');
const url = require('url');

// List of API endpoints that should be forwarded to the backend
const API_ENDPOINTS = [
  '/sessions',
  '/documents',
  '/messages',
  '/users',
  '/tasks',
  '/queries'
];

// Global reference to prevent garbage collection
let mainWindow = null;
let sensemakerProcess = null;
let queryCallbacks = new Map();

// Helper function to extract the actual path from a URL
function extractActualPath(urlStr) {
  const parts = urlStr.split('/index.html');
  return parts[1] || parts[0];
}

async function createInstance () {
  try {
    console.log('[DESKTOP] Creating instance...');
    
    // Start the background process
    sensemakerProcess = fork(path.join(__dirname, 'background.js'));
    
    // Handle messages from background process
    sensemakerProcess.on('message', (message) => {
      switch (message.type) {
        case 'debug':
          if (settings.debug) {
            console.debug('[DESKTOP]', '[SENSEMAKER]', 'Debug:', message.message);
          }
          break;
        case 'log':
          console.log('[DESKTOP]', '[SENSEMAKER]', message.message);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sensemaker:log', message.message);
          }
          break;
        case 'ready':
          console.log('[DESKTOP] Sensemaker is ready.');
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sensemaker:ready');
          }
          break;
        case 'error':
          console.error('[DESKTOP] Sensemaker error:', message.error);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sensemaker:error', message.error);
          }
          break;
        case 'queryResult':
          const callback = queryCallbacks.get(message.id);
          if (callback) {
            callback.resolve(message.result);
            queryCallbacks.delete(message.id);
          }
          break;
      }
    });

    // Start Sensemaker in background process
    sensemakerProcess.send({ type: 'start' });

    console.log('[DESKTOP] Creating browser window...');
    // Create browser window with secure settings
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false, // Security: disable node integration
        contextIsolation: true, // Security: enable context isolation
        preload: path.join(__dirname, 'preload.js'), // Use preload script for secure communication
        webSecurity: true,
        allowRunningInsecureContent: false
      },
      title: 'Sensemaker',
      icon: path.join(__dirname, '../assets/images/sensemaker-icon.png'),
      show: false // Don't show until ready
    });

    // Add window event handlers
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('[DESKTOP] Failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('[DESKTOP] Page finished loading');
    });

    mainWindow.on('ready-to-show', () => {
      console.log('[DESKTOP] Window ready to show');
      mainWindow.show();
    });

    // Set up protocol handlers
    console.log('[DESKTOP] Setting up protocol handlers...');

    // Handle HTTP requests
    protocol.handle('http', (request) => {
      const parsedUrl = new URL(request.url);
      const acceptHeader = request.headers.get('Accept');
      const actualPath = extractActualPath(parsedUrl.pathname);
      
      console.debug('[DESKTOP] HTTP request:', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers),
        path: actualPath
      });
      
      // If request accepts JSON or is an API endpoint, forward to backend
      if (acceptHeader?.includes('application/json') || API_ENDPOINTS.some(endpoint => actualPath.startsWith(endpoint))) {
        return new Promise((resolve, reject) => {
          const backendReq = http.request({
            hostname: 'localhost',
            port: settings.http.port || 4242,
            path: actualPath + parsedUrl.search,
            method: request.method,
            headers: Object.fromEntries(request.headers)
          }, (backendRes) => {
            const chunks = [];
            backendRes.on('data', (chunk) => chunks.push(chunk));
            backendRes.on('end', () => {
              const body = Buffer.concat(chunks);
              console.debug('[DESKTOP] Backend response:', {
                status: backendRes.statusCode,
                headers: backendRes.headers
              });
              resolve(new Response(body, {
                status: backendRes.statusCode,
                headers: backendRes.headers
              }));
            });
          });

          backendReq.on('error', (error) => {
            console.error('[DESKTOP] Backend request error:', error);
            reject(error);
          });

          // Forward request body if exists
          if (request.body) {
            request.body.pipe(backendReq);
          } else {
            backendReq.end();
          }
        });
      }

      // For non-API requests, return a 404
      console.debug('[DESKTOP] Non-API request, returning 404');
      return new Response('Not Found', { status: 404 });
    });

    // Handle file protocol
    protocol.interceptFileProtocol('file', (request, callback) => {
      const urlStr = request.url.substr(7); // Remove 'file://' prefix
      const decodedUrl = decodeURIComponent(urlStr);
      
      console.debug('[DESKTOP] File protocol request:', {
        originalUrl: request.url,
        decodedUrl: decodedUrl
      });

      // Extract the actual path after any potential index.html
      const actualPath = extractActualPath(decodedUrl);

      // Check if this is an API endpoint that should be redirected
      if (API_ENDPOINTS.some(endpoint => actualPath.startsWith(endpoint))) {
        const redirectUrl = `http://localhost:${settings.http.port || 4242}${actualPath}`;
        console.debug('[DESKTOP] Redirecting API request to:', redirectUrl);
        // Instead of using loadURL which forces GET, let the HTTP protocol handler handle it
        callback({ error: -6 }); // Abort the file protocol handler
        return;
      }

      // Special case for index.html or root path
      const htmlPath = path.join(__dirname, '../assets/index.html');
      if (decodedUrl.endsWith('index.html') || decodedUrl === '' || decodedUrl === '/') {
        console.debug('[DESKTOP] Serving index.html from:', htmlPath);
        callback({ path: htmlPath });
        return;
      }

      // For all other files, resolve relative to assets
      const assetsPath = path.join(__dirname, '../assets');
      let resolvedPath;

      if (decodedUrl.startsWith(assetsPath)) {
        resolvedPath = path.normalize(decodedUrl);
      } else {
        const relativePath = decodedUrl.replace(/^\//, '');
        resolvedPath = path.join(assetsPath, relativePath);
      }

      console.debug('[DESKTOP] Resolved path:', resolvedPath);

      // Security check
      if (!resolvedPath.startsWith(assetsPath)) {
        console.error('[DESKTOP] Attempted to access file outside assets directory:', resolvedPath);
        callback({ error: -6 }); // net::ERR_FILE_NOT_FOUND
        return;
      }

      // Check if file exists
      if (!require('fs').existsSync(resolvedPath)) {
        console.error('[DESKTOP] File not found:', resolvedPath);
        callback({ error: -6 }); // net::ERR_FILE_NOT_FOUND
        return;
      }

      callback({ path: resolvedPath });
    });

    // Load the HTML file
    console.log('[DESKTOP] Loading HTML file...');
    const htmlPath = path.join(__dirname, '../assets/index.html');
    console.debug('[DESKTOP] Loading initial HTML from:', htmlPath);
    await mainWindow.loadFile(htmlPath).catch((error) => {
      console.error('[DESKTOP] Failed to load HTML file:', error);
      mainWindow.loadURL(`data:text/html,<h1>Error loading application</h1><p>${error.message}</p>`);
    });

    console.log('[DESKTOP] HTML file loaded');

    // Handle window closed
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Prevent external URLs from opening in the app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    });
    
    // Handle navigation attempts
    mainWindow.webContents.on('will-navigate', (event, url) => {
      const parsedUrl = new URL(url);
      const actualPath = extractActualPath(parsedUrl.pathname);
      
      // Allow API endpoints and local file paths
      if (API_ENDPOINTS.some(endpoint => actualPath.startsWith(endpoint)) || url.startsWith('file://')) {
        return;
      }
      
      // Block and open external URLs in browser
      event.preventDefault();
      require('electron').shell.openExternal(url);
    });

    return {
      window: mainWindow
    };
  } catch (error) {
    console.error('[DESKTOP] Failed to create instance:', error);
    app.quit();
  }
}

// Set up IPC handlers for secure communication
function setupIPCHandlers () {
  // Handle Sensemaker queries
  ipcMain.handle('sensemaker:query', async (event, query) => {
    if (!sensemakerProcess) {
      throw new Error('Sensemaker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      queryCallbacks.set(id, { resolve, reject });
      sensemakerProcess.send({ type: 'query', query, id });
    });
  });

  // Handle app info requests
  ipcMain.handle('app:getInfo', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome
    };
  });
}

// App event handlers
app.whenReady().then(() => {
  setupIPCHandlers();
  createInstance();
});

// Handle all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createInstance();
  }
});

// Handle before quit - cleanup
app.on('before-quit', async () => {
  if (sensemakerProcess) {
    sensemakerProcess.send({ type: 'stop' });
    // Give it a moment to clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
    sensemakerProcess.kill();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
