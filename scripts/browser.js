// Dependencies
// import * as React from 'react';
// import { createRoot } from 'react-dom/client';

// Components
import Jeeves from '../components/Jeeves';

// Settings
const settings = {
  currency: 'BTC'
};

// Main Process Definition
async function main (input = {}) {
  console.log('[JEEVES:BROWSER] main() executing...');

  window.addEventListener('load', async () => {
    console.log('loaded!');
  });

  // const container = document.getElementById('fabric-application-root');
  // const root = createRoot(container);
  // root.render(<Jeeves state={input} />);

  const chatbar = document.createElement('fabric-chat-bar');
  chatbar.style = 'position: absolute; bottom: 1em;';
  document.append(chatbar);

  return {
    react: { root }
  }
}

// Run Main Process
main(settings).catch((exception) => {
  console.error('[JEEVES:BROWSER] Main Process Exception:', exception);
}).then((output) => {
  console.log('[JEEVES:BROWSER] Main Process Output:', output);
});
