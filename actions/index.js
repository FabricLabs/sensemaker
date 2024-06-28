/**
 * Actions Index
 */
'use strict';

// # Actions
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
  deleteDocumentSection,
} = require('../actions/documentActions');

// ## Files Actions
const {
  fetchFiles,
  fetchFile,
  uploadFile,
  searchFile,
} = require('../actions/fileActions');

// ## Upload Actions
const {
  fetchUploads,
  fetchUpload,
  searchUploads,
} = require('../actions/uploadActions');

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

module.exports = {
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
  deleteDocumentSection: deleteDocumentSection,
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
  fetchUploads,
  fetchUpload,
  searchUploads,
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
