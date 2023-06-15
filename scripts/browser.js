// Dependencies
const React = require('react');
const ReactDOM = require('react-dom/client');
const { Provider, connect } = require('react-redux');

// Redux
const store = require('../stores/redux');

// Components
const JeevesUI = require('../components/JeevesUI');

// Settings
const settings = {
  currency: 'BTC'
};

// Main Process Definition
async function main (input = {}) {
  console.log('[JEEVES:BROWSER] main() executing...');

  window.addEventListener('load', async () => {
    console.log('loaded!');

    // const chatbar = document.createElement('fabric-chat-bar');
    // chatbar.style = 'position: absolute; bottom: 1em;';
    // document.body.append(chatbar);
  });

  // React
  const container = document.getElementById('react-application');
  const root = ReactDOM.createRoot(container);
  const live = connect((state) => ({
    isAuthenticated: state.isAuthenticated
  }))(JeevesUI);

  // Render
  root.render(React.createElement(Provider, { store }, React.createElement(live)));

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

// module.exports = main;
