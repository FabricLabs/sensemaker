// Dependencies
import * as React from 'react';
import { createRoot } from 'react-dom/client';

// Components
import Sensemaker from '../components/Sensemaker';

// Settings
const settings = {
  currency: 'BTC'
};

// Main Process Definition
async function main (input = {}) {
  console.log('[SENSEMAKER:BROWSER] main() executing...');

  window.addEventListener('load', async () => {
    console.log('loaded!');
  });

  const container = document.getElementById('fabric-application-root');
  const root = createRoot(container);

  const chatbar = document.createElement('fabric-chat-bar');
  chatbar.style = 'position: absolute; bottom: 1em;';
  document.append(chatbar);

  // root.render(<Sensemaker state={input} />);

  return {
    react: { root }
  }
}

// Run Main Process
main(settings).catch((exception) => {
  console.error('[SENSEMAKER:BROWSER] Main Process Exception:', exception);
}).then((output) => {
  console.log('[SENSEMAKER:BROWSER] Main Process Output:', output);
});
