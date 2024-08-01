// Dependencies
// import * as React from 'react';
// import { createRoot } from 'react-dom/client';

// Components
// import Sensemaker from '../components/Sensemaker';
import * as FabricChatBar from '@fabric/http/components/FabricChatBar';

// Settings
const settings = {
  currency: 'BTC'
};

// Main Process Definition
async function main (input = {}) {
  console.log('[SENSEMAKER:BROWSER] main() executing...');

  customElements.define('fabric-chat-bar', FabricChatBar);

  window.addEventListener('load', async () => {
    console.log('loaded!');

    const container = document.getElementById('fabric-application-root');
    // const root = createRoot(container);

    const chatbar = document.createElement('fabric-chat-bar');

    chatbar.style = 'position: absolute; bottom: 1em;';

    container.append(chatbar);

    // root.render(<Sensemaker state={input} />);
  });

  return {
    // react: { root }
  }
}

// Run Main Process
main(settings).catch((exception) => {
  console.error('[SENSEMAKER:BROWSER] Main Process Exception:', exception);
}).then((output) => {
  console.log('[SENSEMAKER:BROWSER] Main Process Output:', output);
});
