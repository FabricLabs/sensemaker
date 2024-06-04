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

// ## Actions
// Actions drive the application.  They are the only way to change the state.

// ## Authentication (and Authorization) Actions
const {
  login,
  reLogin,
  register,
  logout,
  checkUsernameAvailable,
  checkEmailAvailable,
  fullRegister
} = require('../actions/authActions');

// ## Admin Actions
const {
  fetchAdminStats,
  fetchAllConversationsFromAPI,
  createInvitation,
  editUsername,
  editEmail,
} = require('../actions/adminActions');

// ## Invitation Actions
const {
  fetchInvitation,
  fetchInvitations,
  sendInvitation,
  reSendInvitation,
  checkInvitationToken,
  acceptInvitation,
  declineInvitation,
  deleteInvitation,
} = require('../actions/invitationActions');

// ## Inquiries Actions
const {
  fetchInquiry,
  fetchInquiries,
  deleteInquiry,
  createInquiry
} = require('../actions/inquiriesActions');

// ## Case Actions
const {
  fetchCases,
  fetchCase,
  searchCase,
} = require('../actions/caseActions');

// ## Courts Actions
const {
  fetchCourts,
  fetchCourt,
  fetchCourtById,
  searchCourt,
  fetchCourtsByJurisdiction,
} = require('../actions/courtActions');

// ## Jurisdiction Actions
const {
  fetchJurisdictions,
  fetchJurisdiction
} = require('../actions/jurisdictionsActions');

// ## Contract Actions
const {
  resetChat,
  submitMessage,
  regenAnswer,
  getMessages,
  getMessageInformation,
} = require('../actions/chatActions');

// ## Conversation Actions
const {
  fetchContracts,
  fetchContract,
  signContract
} = require('../actions/contractActions');

// ## Statute Actions
const {
  fetchStatutes,
  fetchStatute
} = require('../actions/statuteActions');

// ## Court Actions
const {
  fetchConversations,
  fetchConversation,
  fetchMatterConversations,
  conversationTitleEdit,
} = require('../actions/conversationActions');

// ## Person Actions
const {
  fetchPeople,
  fetchPerson
} = require('../actions/personActions');

// ## Reporter Actions
const {
  fetchReporters,
  fetchReporter,
  searchReporter,
} = require('../actions/reportersActions');

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

// ## Volume Actions
const {
  fetchVolumes,
  fetchVolume
} = require('../actions/volumeActions');

// ## Document Actions
const {
  fetchDocuments,
  fetchDocument,
  uploadDocument,
  searchDocument,
  createDocument,
  createDocumentSection,
  editDocumentSection,
  editDocument,
  deleteDocument,
  fetchDocumentSections,
} = require('../actions/documentActions');

// ## Files Actions
const {
  fetchFiles,
  fetchFile,
  uploadFile,
  searchFile,
} = require('../actions/fileActions');

// ## Matters Actions
const {
  fetchMatters,
  fetchMatter,
  createMatter,
  addContext,
  removeFile,
  removeNote,
  editMatter,
  fetchMatterFiles,
  fetchMatterNotes,
} = require('../actions/mattersActions');

// ## Users Actions
const {
  fetchUsers,
  fetchUser,
  askPasswordReset,
} = require('../actions/usersActions');

// ## Search Actions
const {
  searchGlobal,
} = require('../actions/searchActions');

// ## Feedback Actions
const {
  sendFeedback,
} = require('../actions/feedbackActions');

// ## Help Actions
const {
  fetchHelpConversations,
  fetchAdminHelpConversations,
  fetchHelpMessages,
  sendHelpMessage,
  markMessagesRead,
  clearHelpMessages,
} = require('../actions/helpActions');

// ## Main Process
async function main(input = {}) {
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
    }
  };

  const mapDispatchToProps = {
    fetchCases: fetchCases,
    fetchCase: fetchCase,
    searchCase: searchCase,
    fetchContract: fetchContract,
    signContract: signContract,
    fetchConversation: fetchConversation,
    fetchConversations: fetchConversations,
    conversationTitleEdit: conversationTitleEdit,
    fetchStatutes: fetchStatutes,
    fetchStatute: fetchStatute,
    fetchCourts: fetchCourts,
    fetchCourtsByJurisdiction: fetchCourtsByJurisdiction,
    fetchCourt: fetchCourt,
    fetchCourtById: fetchCourtById,
    searchCourt: searchCourt,
    fetchJurisdictions: fetchJurisdictions,
    fetchJurisdiction: fetchJurisdiction,
    fetchDocuments: fetchDocuments,
    fetchDocument: fetchDocument,
    fetchDocumentSections: fetchDocumentSections,
    searchDocument: searchDocument,
    uploadDocument: uploadDocument,
    createDocument: createDocument,
    createDocumentSection: createDocumentSection,
    editDocumentSection: editDocumentSection,
    editDocument: editDocument,
    deleteDocument: deleteDocument,
    fetchFiles: fetchFiles,
    fetchFile: fetchFile,
    uploadFile: uploadFile,
    fetchInquiry: fetchInquiry,
    fetchInquiries: fetchInquiries,
    deleteInquiry: deleteInquiry,
    createInquiry: createInquiry,
    fetchInvitation: fetchInvitation,
    fetchInvitations: fetchInvitations,
    sendInvitation: sendInvitation,
    reSendInvitation: reSendInvitation,
    checkInvitationToken: checkInvitationToken,
    acceptInvitation: acceptInvitation,
    declineInvitation: declineInvitation,
    deleteInvitation: deleteInvitation,
    fetchJudges: fetchJudges,
    fetchJudge: fetchJudge,
    fetchPeople: fetchPeople,
    fetchPerson: fetchPerson,
    fetchOpinions: fetchOpinions,
    fetchOpinion: fetchOpinion,
    fetchReporters: fetchReporters,
    fetchReporter: fetchReporter,
    searchReporter: searchReporter,
    fetchVolumes: fetchVolumes,
    fetchVolume: fetchVolume,
    fetchAdminStats: fetchAdminStats,
    fetchAllConversationsFromAPI: fetchAllConversationsFromAPI,
    login: login,
    logout: logout,
    reLogin: reLogin,
    register: register,
    fullRegister: fullRegister,
    checkUsernameAvailable: checkUsernameAvailable,
    checkEmailAvailable: checkEmailAvailable,
    createInvitation: createInvitation,
    editUsername: editUsername,
    editEmail: editEmail,
    resetChat: resetChat,
    submitMessage: submitMessage,
    regenAnswer: regenAnswer,
    getMessages: getMessages,
    getMessageInformation: getMessageInformation,
    fetchMatters: fetchMatters,
    fetchMatter: fetchMatter,
    createMatter: createMatter,
    addContext: addContext,
    removeFile: removeFile,
    removeNote: removeNote,
    fetchMatterConversations: fetchMatterConversations,
    fetchMatterFiles: fetchMatterFiles,
    fetchMatterNotes: fetchMatterNotes,
    editMatter: editMatter,
    fetchUsers: fetchUsers,
    fetchUser: fetchUser,
    askPasswordReset: askPasswordReset,
    searchGlobal: searchGlobal,
    sendFeedback: sendFeedback,
    fetchHelpConversations: fetchHelpConversations,
    fetchAdminHelpConversations: fetchAdminHelpConversations,
    fetchHelpMessages: fetchHelpMessages,
    sendHelpMessage: sendHelpMessage,
    markMessagesRead: markMessagesRead,
    clearHelpMessages: clearHelpMessages,

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

  // Updates (1s)
  setInterval(() => {
    document.querySelectorAll('abbr.relative-time').forEach((el) => {
      el.innerHTML = toRelativeTime(el.getAttribute('title'));
    });
  }, 1000); // 1 second

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
