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
  resetChat,
  submitMessage,
  getMessages
} = require('../actions/chatActions');

const {
  fetchContract
} = require('../actions/contractActions');

const {
  fetchConversations,
  fetchConversation
} = require('../actions/conversationActions');

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
  const mapStateToProps = (state) => {
    return {
      auth: state.auth,
      chat: state.chat,
      contracts: state.contracts,
      conversation: state.conversations.conversation,
      conversations: state.conversations.conversations,
      error: state.auth.error,
      isAuthenticated: state.auth.isAuthenticated,
      isAdmin: state.auth.isAdmin,
      isSending: state.chat.isSending,
      token: state.auth.token
    }
  };

  const mapDispatchToProps = {
    fetchContract: fetchContract,
    fetchConversation: fetchConversation,
    fetchConversations: fetchConversations,
    fetchAdminStats: fetchAdminStats,
    login: login,
    register: register,
    resetChat: resetChat,
    submitMessage: submitMessage,
    getMessages: getMessages
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
