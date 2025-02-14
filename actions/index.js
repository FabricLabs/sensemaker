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

// ## Agent Actions
const {
  fetchAgent,
  fetchAgentStats
} = require('../actions/agentActions');

// # Bitcoin Actions
const {
  fetchBitcoinStats,
  fetchBitcoinBlock,
  fetchBitcoinBlocks,
  fetchBitcoinTransaction,
  fetchBitcoinTransactions
} = require('../actions/bitcoinActions');

// ## Chat Actions
const {
  resetChat,
  submitMessage,
  fetchResponse,
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

// ## Disk Actions
const {
  fetchDiskPath,
  fetchDiskStats
} = require('../actions/diskActions');

// # Discord Actions
const {
  fetchDiscordStats,
  fetchDiscordChannel,
  fetchDiscordChannels,
  fetchDiscordGuild,
  fetchDiscordGuilds,
  fetchDiscordUser,
  fetchDiscordUsers
} = require('../actions/discordActions');

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

// # Fabric Actions
const {
  fetchFabricStats
} = require('../actions/fabricActions');

// ## Feedback Actions
const {
  sendFeedback
} = require('../actions/feedbackActions');

// ## Files Actions
const {
  fetchFiles,
  fetchFile,
  uploadFile,
  searchFile,
  fetchUserFiles,
} = require('../actions/fileActions');

// # GitHub Actions
const {
  fetchGitHubStats
} = require('../actions/githubActions');

const {
  fetchGroup,
  fetchGroups,
  createGroup
} = require('../actions/groupActions');

// ## Help Actions
const {
  fetchHelpConversations,
  fetchAdminHelpConversations,
  fetchHelpMessages,
  sendHelpMessage,
  markMessagesRead,
  clearHelpMessages,
} = require('../actions/helpActions');

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

// # Matrix Actions
const {
  fetchMatrixStats
} = require('../actions/matrixActions');

// ## Person Actions
const {
  fetchPeople,
  fetchPerson
} = require('../actions/personActions');

const {
  fetchPeer,
  fetchPeers,
  createPeer
} = require('../actions/peerActions');

// ## Redis Actions
const {
  syncRedisQueue,
  lastJobTaken,
  lastJobCompleted,
  clearQueue,
} = require('../actions/redisActions');

// ## Search Actions
const {
  searchGlobal,
} = require('../actions/searchActions');

const {
  fetchSource,
  fetchSources,
  createSource
} = require('../actions/sourceActions');

// ## Task Actions
const {
  createTask,
  fetchTasks,
  fetchTask,
  updateTask
} = require('../actions/taskActions');

// ## Upload Actions
const {
  fetchUploads,
  fetchUpload,
  searchUploads,
} = require('../actions/uploadActions');

// ## Wallet Actions
const {
  fetchKey,
  fetchKeys,
  createKey,
} = require('../actions/walletActions');

// ## Export
module.exports = {
  fetchAgent,
  fetchAgentStats,
  fetchBitcoinStats,
  fetchBitcoinBlock,
  fetchBitcoinBlocks,
  fetchBitcoinTransaction,
  fetchBitcoinTransactions,
  fetchDiscordStats,
  fetchDiscordChannel,
  fetchDiscordChannels,
  fetchDiscordGuild,
  fetchDiscordGuilds,
  fetchDiscordUser,
  fetchDiscordUsers,
  fetchFabricStats,
  fetchGitHubStats,
  fetchKey,
  fetchKeys,
  createKey,
  fetchContract: fetchContract,
  signContract: signContract,
  fetchConversation: fetchConversation,
  fetchConversations: fetchConversations,
  conversationTitleEdit: conversationTitleEdit,
  fetchDiskPath: fetchDiskPath,
  fetchDiskStats: fetchDiskStats,
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
  fetchGroup: fetchGroup,
  fetchGroups: fetchGroups,
  createGroup: createGroup,
  createPeer: createPeer,
  createSource: createSource,
  fetchUserFiles: fetchUserFiles,
  fetchInquiry: fetchInquiry,
  fetchInquiries: fetchInquiries,
  deleteInquiry: deleteInquiry,
  createInquiry: createInquiry,
  createTask: createTask,
  updateTask: updateTask,
  fetchInvitation: fetchInvitation,
  fetchInvitations: fetchInvitations,
  sendInvitation: sendInvitation,
  reSendInvitation: reSendInvitation,
  checkInvitationToken: checkInvitationToken,
  acceptInvitation: acceptInvitation,
  declineInvitation: declineInvitation,
  deleteInvitation: deleteInvitation,
  fetchMatrixStats,
  fetchPeer: fetchPeer,
  fetchPeers: fetchPeers,
  fetchPeople: fetchPeople,
  fetchPerson: fetchPerson,
  fetchResponse: fetchResponse,
  fetchSource: fetchSource,
  fetchSources: fetchSources,
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
