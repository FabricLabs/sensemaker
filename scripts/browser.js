// # The Jeeves Browser Script
// This file runs in the browser, and is responsible for rendering the UI.

// ## Overview
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

// ## Actions
// Actions drive the application.  They are the only way to change the state.

// ## Authentication (and Authorization) Actions
const { login, reLogin, register, logout } = require('../actions/authActions');

// ## Admin Actions
const { 
  fetchAdminStats,
  fetchAllConversationsFromAPI
} = require('../actions/adminActions');

// ## Case Actions
const {
  fetchCases,
  fetchCase
} = require('../actions/caseActions');

// ## Chat Actions
const {
  fetchCourts,
  fetchCourt
} = require('../actions/courtActions');

// ## Contract Actions
const {
  resetChat,
  submitMessage,
  regenAnswer,
  getMessages
} = require('../actions/chatActions');

// ## Conversation Actions
const {
  fetchContract,
  signContract
} = require('../actions/contractActions');

// ## Court Actions
const {
  fetchConversations,
  fetchConversation
} = require('../actions/conversationActions');

// ## Person Actions
const {
  fetchPeople,
  fetchPerson
} = require('../actions/personActions');

// ## Judge Actions
const {
  fetchJudges,
  fetchJudge
} = require('../actions/judgeActions');

// ## Opinion Actions
const {
  fetchOpinions,
  fetchOpinion
} = require('../actions/opinionActions');

// ## Document Actions
const {
  fetchDocuments,
  fetchDocument
} = require('../actions/documentActions');

// ## Main Process
async function main (input = {}) {
  console.log('[JEEVES:BROWSER] main() executing...');

  window.addEventListener('load', async () => {
    console.debug('[JEEVES]', 'Window loaded!');

    // TODO: consider localforage
    // TODO: consider schema from Knex / MySQL
    // TODO: consider GraphQL to pass schema
    // const request = indexedDB.open('JeevesDB', 1);

    // request.onerror = function (event) {
    //   console.error('Error opening IndexedDB:', event.target.errorCode);
    // };

    // request.onupgradeneeded = function (event) {
    //   db = event.target.result;

    //   if (!db.objectStoreNames.contains('tokens')) {
    //     db.createObjectStore('tokens');
    //   }
    // };

    // request.onsuccess = function (event) {
    //   db = event.target.result;
    // };

    // const chatbar = document.createElement('fabric-chat-bar');
    // chatbar.style = 'position: absolute; bottom: 1em;';
    // document.body.append(chatbar);
  });

  // ## React Application
  // ### Connect Actions (Redux)
  const mapStateToProps = (state) => {
    return {
      auth: state.auth,
      chat: state.chat,
      cases: state.cases,
      contracts: state.contracts,
      conversation: state.conversations.conversation,
      conversations: state.conversations.conversations,
      courts: state.courts,
      documents: state.documents,
      judges: state.judges,
      people: state.people,
      opinions: state.opinions,
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
    fetchCourts: fetchCourts,
    fetchCourt: fetchCourt,
    fetchDocuments: fetchDocuments,
    fetchDocument: fetchDocument,
    fetchJudges: fetchJudges,
    fetchJudge: fetchJudge,
    fetchPeople: fetchPeople,
    fetchPerson: fetchPerson,
    fetchOpinions: fetchOpinions,
    fetchOpinion: fetchOpinion,
    fetchAdminStats: fetchAdminStats,
    fetchAllConversationsFromAPI: fetchAllConversationsFromAPI,
    login: login,
    logout: logout,
    reLogin: reLogin,
    register: register,
    resetChat: resetChat,
    submitMessage: submitMessage,
    regenAnswer: regenAnswer,
    getMessages: getMessages
  };

  console.debug('[JEEVES]', 'Connecting UI...');
  const ConnectedUI = connect(mapStateToProps, mapDispatchToProps)(JeevesUI);

  // ## DOM Attachment
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
