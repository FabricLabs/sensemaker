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
  const container = document.getElementById('fabric-application-root');
  const root = createRoot(container);

  root.render(<Sensemaker state={input} />);

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
