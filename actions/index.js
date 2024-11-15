/**
 * Actions Index
 */
'use strict';

// # Actions
// Actions drive the application.  They are the only way to change the state.
// ## Account Actions
const {
  fetchUsers,
  fetchUser,
  askPasswordReset,
} = require('../actions/accountActions');

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

// ## Chat Actions
const {
  resetChat,
  submitMessage,
  regenAnswer,
  getMessages,
  getMessageInformation,
} = require('../actions/chatActions');

// ## Contract Actions
const {
  fetchContracts,
  fetchContract,
  signContract
} = require('../actions/contractActions');

// ## Conversation Actions
const {
  fetchConversations,
  fetchConversation,
  conversationTitleEdit,
} = require('../actions/conversationActions');

// ## Person Actions
const {
  fetchPeople,
  fetchPerson
} = require('../actions/personActions');

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
  deleteDocumentSection,
} = require('../actions/documentActions');

// ## Files Actions
const {
  fetchFiles,
  fetchFile,
  uploadFile,
  searchFile,
  fetchUserFiles,
} = require('../actions/fileActions');

// ## Upload Actions
const {
  fetchUploads,
  fetchUpload,
  searchUploads,
} = require('../actions/uploadActions');

// ## Search Actions
const {
  searchGlobal,
} = require('../actions/searchActions');

// ## Task Actions
const {
  createTask,
  fetchTasks,
  fetchTask
} = require('../actions/taskActions');

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

// ## Redis Actions
const {
  syncRedisQueue,
  lastJobTaken,
  lastJobCompleted,
  clearQueue,
} = require('../actions/redisActions');

module.exports = {
  fetchContract: fetchContract,
  signContract: signContract,
  fetchConversation: fetchConversation,
  fetchConversations: fetchConversations,
  conversationTitleEdit: conversationTitleEdit,
  fetchDocuments: fetchDocuments,
  fetchDocument: fetchDocument,
  fetchDocumentSections: fetchDocumentSections,
  searchDocument: searchDocument,
  uploadDocument: uploadDocument,
  createDocument: createDocument,
  createDocumentSection: createDocumentSection,
  deleteDocumentSection: deleteDocumentSection,
  editDocumentSection: editDocumentSection,
  editDocument: editDocument,
  deleteDocument: deleteDocument,
  fetchFiles: fetchFiles,
  fetchFile: fetchFile,
  uploadFile: uploadFile,
  fetchUserFiles: fetchUserFiles,
  fetchInquiry: fetchInquiry,
  fetchInquiries: fetchInquiries,
  deleteInquiry: deleteInquiry,
  createInquiry: createInquiry,
  createTask: createTask,
  fetchInvitation: fetchInvitation,
  fetchInvitations: fetchInvitations,
  sendInvitation: sendInvitation,
  reSendInvitation: reSendInvitation,
  checkInvitationToken: checkInvitationToken,
  acceptInvitation: acceptInvitation,
  declineInvitation: declineInvitation,
  deleteInvitation: deleteInvitation,
  fetchPeople: fetchPeople,
  fetchPerson: fetchPerson,
  fetchTask: fetchTask,
  fetchTasks: fetchTasks,
  fetchUploads,
  fetchUpload,
  searchUploads,
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
  syncRedisQueue: syncRedisQueue,
  lastJobTaken: lastJobTaken,
  lastJobCompleted: lastJobCompleted,
  clearQueue: clearQueue
};
