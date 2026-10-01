'use strict';

// Local Settings
const defaults = require('../settings/local');

// Dependencies
const fs = require('fs');
const path = require('path');
const net = require('net');

// Fabric Types
const CLI = require('@fabric/core/types/cli');
const Peer = require('@fabric/core/types/peer');
const Identity = require('@fabric/core/types/identity');
const Message = require('@fabric/core/types/message');
const Key = require('@fabric/core/types/key');

// Services
const Sensemaker = require('../services/sensemaker');

// Function to check if port is in use
async function isPortInUse (port) {
  return new Promise((resolve) => {
    const server = net.createServer().once('error', () => {
        resolve(true);
      }).once('listening', () => {
        server.close();
        resolve(false);
      }).listen(port);
  });
}

// Main
async function main (settings = {}) {
  // Check if Sensemaker is already running
  const port = settings.http.port || 3040;
  if (await isPortInUse(port)) {
    console.log(`Sensemaker appears to be already running on port ${port}. Exiting...`);
    process.exit(0);
  }

  // Ensure storage directory exists
  const storagePath = path.join(process.env.HOME, '.fabric', 'demo');
  const fabricPath = path.join(storagePath, '.fabric');

  // Create all necessary directories
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  if (!fs.existsSync(fabricPath)) {
    fs.mkdirSync(fabricPath, { recursive: true });
  }

  // Create a key first - this will generate its own mnemonic
  const key = new Key();

  // Initialize Sensemaker with settings
  const sensemaker = new Sensemaker({
    ...defaults,
    storage: {
      path: storagePath
    }
  });

  // Create CLI instance with proper settings
  const cli = new CLI({
    ...defaults,
    storage: {
      path: storagePath,
      encoding: 'utf8'
    },
    render: true,
    debug: true,
    bitcoin: {
      enable: false
    },
    lightning: {
      enable: false
    },
    network: 'regtest',
    peering: true,
    port: 9000,
    interface: '0.0.0.0',
    upnp: false
  });

  // Create and set identity for CLI with the key
  const identity = new Identity(key);
  cli.assumeIdentity(identity);

  // Array to store peer instances
  const peers = [];

  try {
    // Start Sensemaker first
    console.log('Starting Sensemaker...');
    await sensemaker.start();

    // Start CLI
    console.log('Starting CLI...');
    await cli.start();

    // Create 32 peers with incremental ports starting at 9001
    console.log('Creating peers...');
    for (let i = 0; i < 32; i++) {
      // Create a unique key for each peer
      const peerKey = new Key();
      const peerIdentity = new Identity(peerKey);

      const peer = new Peer({
        port: 9001 + i,
        name: `peer-${i}`,
        network: 'regtest',
        interface: '0.0.0.0',
        upnp: false
      });

      // Set the peer's identity
      peer.assumeIdentity(peerIdentity);

      // Set max listeners for noise stream events
      peer.setMaxListeners(20);
      peers.push(peer);
    }

    // Start all peers
    console.log('Starting peers...');
    for (const peer of peers) {
      await peer.start();

      // Set max listeners for the peer's event emitter
      peer.setMaxListeners(20);

      // Connect peer to CLI with increased max listeners
      cli.trust(peer);

      // Connect peer to CLI's node with proper error handling
      try {
        await peer.node._connect(`${cli.node.pubkeyhash}@localhost:${cli.settings.port}`);
      } catch (err) {
        console.warn(`Warning: Could not connect to peer on port ${peer.settings.port}:`, err);
      }
    }

    // Add message handler for CLI user messages
    cli.node.on('message', async (message) => {
      if (message.type === 'ChatMessage') {
        try {
          const parsed = JSON.parse(message.data);

          // Process the message through Sensemaker
          const request = await sensemaker.handleTextRequest({ 
            query: parsed.object.content,
            actor: parsed.actor,
            context: {
              timestamp: parsed.object.created,
              source: 'cli'
            }
          });

          console.debug('SensemakerRequest:', request);

          // Create response message
          const response = {
            type: 'P2P_CHAT_MESSAGE',
            actor: {
              id: cli.node.id,
              name: 'Sensemaker'
            },
            object: {
              created: Date.now(),
              content: request.content || `I received your message: ${parsed.object.content}`
            },
            target: '/messages'
          };

          // Sign the message with the CLI's identity key
          const responseMessage = Message.fromVector(['ChatMessage', JSON.stringify(response)]).signWithKey(cli.identity.key);

          // Broadcast the response
          cli.node.broadcast(responseMessage);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }
    });

    // Log status
    console.log(`Started CLI with ${peers.length} connected peers`);

    // Keep process running
    process.stdin.resume();
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

main(defaults).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
