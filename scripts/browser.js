'use strict';

// Dependencies
const React = require('react');
const ReactDOM = require('react-dom/client');
const { Provider, connect } = require('react-redux');

// Components
const JeevesUI = require('../components/JeevesUI');

// Actions
const { fetchConversations } = require('../actions/fetchConversations');
const { login } = require('../actions/authActions');

// Settings
const settings = {
  currency: 'BTC'
};

// Redux
const store = require('../stores/redux');

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
  const mapStateToProps = (state) => ({
    auth: state.auth,
    error: state.auth.error,
    isAuthenticated: state.auth.isAuthenticated,
    token: state.auth.token
  });

  const mapDispatchToProps = {
    fetchConversations: fetchConversations,
    login: login
  };

  const ConnectedUI = connect(mapStateToProps, mapDispatchToProps)(JeevesUI);

  // Render
  const container = document.getElementById('application-target');
  const root = ReactDOM.createRoot(container);

  root.render(
    <Provider store={store}>
      <ConnectedUI />
    </Provider>
  );

  // Return
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
