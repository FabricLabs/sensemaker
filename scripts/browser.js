// # The Jeeves Browser Script
// This file runs in the browser, and is responsible for rendering the UI.

// ## Overview
'use strict';

// Dependencies
const React = require('react');
const ReactDOM = require('react-dom/client');
const { Provider, connect } = require('react-redux');

// Functions
const toRelativeTime = require('../functions/toRelativeTime');

// Components
const JeevesUI = require('../components/JeevesUI');

// Settings
const settings = {
  currency: 'BTC'
};

// Redux
const store = require('../stores/redux');
const actions = require('../actions');

// ## Main Process
async function main (input = {}) {
  console.log('[JEEVES:BROWSER] main() executing...');

  customElements.define('fabric-chat-bar', FabricChatBar);

  window.addEventListener('load', async () => {
    console.debug('[JEEVES]', 'Window loaded!');
    // TODO: restore fabric-chat-bar
    // TODO: consider localforage
    // TODO: consider schema from Knex / MySQL
    // TODO: consider GraphQL to pass schema
    // const chatbar = document.createElement('fabric-chat-bar');
    // chatbar.style = 'position: absolute; bottom: 1em;';
    // document.body.append(chatbar);
  });

  // ## React Application
  // ### Connect Actions (Redux)
  // TODO: migrate this to `functions/mapStateToProps.js`
  const mapStateToProps = (state) => {
    return {
      auth: state.auth,
      chat: state.chat,
      cases: state.cases,
      contracts: state.contracts,
      conversation: state.conversations.conversation,
      conversations: state.conversations.conversations,
      matterConversations: state.conversations.matterConversations,
      conversationsLoading: state.conversations.loading,
      courts: state.courts,
      documents: state.documents,
      files: state.files,
      judges: state.judges,
      people: state.people,
      reporters: state.reporters,
      opinions: state.opinions,
      error: state.auth.error,
      inquiries: state.inquiries,
      invitation: state.invitation,
      isAuthenticated: state.auth.isAuthenticated,
      isAdmin: state.auth.isAdmin,
      isCompliant: state.auth.isCompliant,
      isSending: state.chat.isSending,
      token: state.auth.token,
      stats: state.stats,
      matters: state.matters,
      jurisdictions: state.jurisdictions,
      users: state.users,
      search: state.search,
      feedback: state.feedback,
      help: state.help,
      redis: state.redis,
    }
  };

  console.debug('[JEEVES]', 'Connecting UI...');
  const connector = connect(mapStateToProps, actions);
  console.debug('[JEEVES]', 'Connector:', connector);
  const ConnectedUI = connector(JeevesUI);

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

  // Updates (1s)
  setInterval(() => {
    document.querySelectorAll('abbr.relative-time').forEach((el) => {
      el.innerHTML = toRelativeTime(el.getAttribute('title'));
    });
  }, 1000); // 1 second

  // Return
  return {
    // react: { root }
  }
}

// Run Main Process
main(settings).catch((exception) => {
  console.error('[JEEVES:BROWSER] Main Process Exception:', exception);
}).then((output) => {
  console.log('[JEEVES:BROWSER] Main Process Output:', output);
});

// module.exports = main;
