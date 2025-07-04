/**
 * Actions Index
 */
'use strict';

// # Actions
// Actions drive the application.  They are the only way to change the state.
// ## API Actions
const {
  fetchResource
} = require('./apiActions');

// ## Account Actions
const {
  fetchUsers,
  fetchUser,
  askPasswordReset,
} = require('./accountActions');

// ## Alert Actions
const {
  fetchAlerts
} = require('./alertActions');

// ## Announcement Actions
const {
  fetchAnnouncements,
  editAnnouncement
} = require('./announcementActions');

// ## Authentication (and Authorization) Actions
const {
  login,
  reLogin,
  register,
  logout,
  checkUsernameAvailable,
  checkEmailAvailable,
  fullRegister
} = require('./authActions');

// ## Admin Actions
const {
  fetchAdminStats,
  fetchAllConversationsFromAPI,
  createInvitation,
  editUsername,
  editEmail,
} = require('./adminActions');

// ## Agent Actions
const {
  fetchAgent,
  fetchAgentStats
} = require('./agentActions');

// # Bitcoin Actions
const {
  fetchBitcoinStats,
  fetchBitcoinBlock,
  fetchBitcoinBlocks,
  fetchBitcoinTransaction,
  fetchBitcoinTransactions
} = require('./bitcoinActions');

// ## Chat Actions
const {
  resetChat,
  submitMessage,
  fetchResponse,
  regenAnswer,
  getMessages,
  getMessageInformation,
} = require('./chatActions');

// ## Contract Actions
const {
  fetchContracts,
  fetchContract,
  signContract
} = require('./contractActions');

// ## Conversation Actions
const {
  fetchConversations,
  fetchConversation,
  conversationTitleEdit,
} = require('./conversationActions');

// ## Disk Actions
const {
  fetchDiskPath,
  fetchDiskStats
} = require('./diskActions');

// # Discord Actions
const {
  fetchDiscordStats,
  fetchDiscordChannel,
  fetchDiscordChannels,
  fetchDiscordGuild,
  fetchDiscordGuilds,
  fetchDiscordUser,
  fetchDiscordUsers
} = require('./discordActions');

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
  fetchCommit,
} = require('./documentActions');

// # Fabric Actions
const {
  fetchFabricStats
} = require('./fabricActions');

// ## Feedback Actions
const {
  sendFeedback
} = require('./feedbackActions');

// ## Files Actions
const {
  fetchFiles,
  fetchFile,
  uploadFile,
  searchFile,
  fetchUserFiles,
} = require('./fileActions');

// # GitHub Actions
const {
  fetchGitHubStats
} = require('./githubActions');

const {
  fetchGroup,
  fetchGroups,
  createGroup
} = require('./groupActions');

// ## Help Actions
const {
  fetchHelpConversations,
  fetchAdminHelpConversations,
  fetchHelpMessages,
  sendHelpMessage,
  markMessagesRead,
  clearHelpMessages,
} = require('./helpActions');

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
} = require('./invitationActions');

// ## Inquiries Actions
const {
  fetchInquiry,
  fetchInquiries,
  deleteInquiry,
  createInquiry
} = require('./inquiriesActions');

// # Matrix Actions
const {
  authenticateMatrix,
  fetchMatrixStats,
  fetchMatrixRoom
} = require('./matrixActions');

// ## Person Actions
const {
  fetchPeople,
  fetchPerson
} = require('./personActions');

const {
  fetchPeer,
  fetchPeers,
  createPeer
} = require('./peerActions');

// ## Redis Actions
const {
  syncRedisQueue,
  lastJobTaken,
  lastJobCompleted,
  clearQueue,
} = require('./redisActions');

// ## Search Actions
const {
  searchGlobal,
} = require('./searchActions');

const {
  fetchSource,
  fetchSources,
  createSource
} = require('./sourceActions');

// ## Task Actions
const {
  createTask,
  fetchTasks,
  fetchTask,
  updateTask
} = require('./taskActions');

// ## Trigger Actions
const {
  fetchTriggers,
  createTrigger,
  updateTrigger
} = require('./triggerActions');

// ## Upload Actions
const {
  fetchUploads,
  fetchUpload,
  searchUploads,
} = require('./uploadActions');

// ## Wallet Actions
const {
  fetchKey,
  fetchKeys,
  createKey,
} = require('./walletActions');

// ## Export
module.exports = {
  fetchAgent,
  fetchAgentStats,
  fetchAlerts,
  fetchAnnouncements,
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
  fetchResource,
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
  fetchCommit: fetchCommit,
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
  authenticateMatrix,
  fetchMatrixStats,
  fetchMatrixRoom,
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
  clearQueue: clearQueue,
  editAnnouncement: editAnnouncement,
  fetchTriggers,
  createTrigger,
  updateTrigger
};
