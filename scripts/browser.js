'use strict';

// Dependencies
const React = require('react');
const ReactDOM = require('react-dom/client');
const { Provider, connect } = require('react-redux');

// Components
const JeevesUI = require('../components/JeevesUI');

// Settings
const settings = {
  currency: 'BTC'
};

// Redux
const store = require('../stores/redux');

// Actions
const { login, register } = require('../actions/authActions');
const { fetchAdminStats } = require('../actions/adminActions');

const {
  fetchCases,
  fetchCase
} = require('../actions/caseActions');

const {
  resetChat,
  submitMessage,
  getMessages
} = require('../actions/chatActions');

const {
  fetchContract,
  signContract
} = require('../actions/contractActions');

const {
  fetchConversations,
  fetchConversation
} = require('../actions/conversationActions');

// Main Process Definition
async function main (input = {}) {
  console.log('[JEEVES:BROWSER] main() executing...');

  window.addEventListener('load', async () => {
    console.debug('[JEEVES]', 'Window loaded!');

    let db;

    // TODO: consider localforage
    // TODO: consider schema from Knex / MySQL
    // TODO: consider GraphQL to pass schema
    const request = indexedDB.open('JeevesDB', 1);

    request.onerror = function (event) {
      console.error('Error opening IndexedDB:', event.target.errorCode);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;

      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens');
      }
    };

    request.onsuccess = function (event) {
      db = event.target.result;
    };

    // const chatbar = document.createElement('fabric-chat-bar');
    // chatbar.style = 'position: absolute; bottom: 1em;';
    // document.body.append(chatbar);
  });

  // React
  const mapStateToProps = (state) => {
    return {
      auth: state.auth,
      chat: state.chat,
      cases: state.cases,
      contracts: state.contracts,
      conversation: state.conversations.conversation,
      conversations: state.conversations.conversations,
      error: state.auth.error,
      isAuthenticated: state.auth.isAuthenticated,
      isAdmin: state.auth.isAdmin,
      isCompliant: state.auth.isCompliant,
      isSending: state.chat.isSending,
      token: state.auth.token
    }
  };

  const mapDispatchToProps = {
    fetchCases: fetchCases,
    fetchCase: fetchCase,
    fetchContract: fetchContract,
    signContract: signContract,
    fetchConversation: fetchConversation,
    fetchConversations: fetchConversations,
    fetchAdminStats: fetchAdminStats,
    login: login,
    register: register,
    resetChat: resetChat,
    submitMessage: submitMessage,
    getMessages: getMessages
  };

  console.debug('[JEEVES]', 'Connecting UI...');
  const ConnectedUI = connect(mapStateToProps, mapDispatchToProps)(JeevesUI);

  // Render
  const container = document.getElementById('application-target');
  const root = ReactDOM.createRoot(container);

  console.debug('[JEEVES]', 'Rendering UI...');
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
