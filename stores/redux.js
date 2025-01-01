'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
const accountsReducer = require('../reducers/accountsReducer');
const adminReducer = require('../reducers/adminReducer');
const authReducer = require('../reducers/authReducer');
const bitcoinReducer = require('../reducers/bitcoinReducer');
const bridgeReducer = require('../reducers/bridgeReducer');
const chatReducer = require('../reducers/chatReducer');
const contractReducer = require('../reducers/contractReducer');
const conversationReducer = require('../reducers/conversationReducer');
const discordReducer = require('../reducers/discordReducer');
const documentReducer = require('../reducers/documentReducer');
 const fabricReducer = require('../reducers/fabricReducer');
const fileReducer = require('../reducers/fileReducer');
const githubReducer = require('../reducers/githubReducer');
const groupsReducer = require('../reducers/groupsReducer');
const inquiriesReducer = require('../reducers/inquiriesReducer');
const invitationReducer = require('../reducers/invitationReducer');
const matrixReducer = require('../reducers/matrixReducer');
const peersReducer = require('../reducers/peersReducer');
const personReducer = require('../reducers/personReducer');
const searchReducer = require('../reducers/searchReducer');
const sourcesReducer = require('../reducers/sourcesReducer');
const tasksReducer = require('../reducers/tasksReducer');
const feedbackReducer = require('../reducers/feedbackReducer');
const helpReducer = require('../reducers/helpReducer');
const redisReducer = require('../reducers/redisReducer');
const walletReducer = require('../reducers/walletReducer');

// Root
const rootReducer = combineReducers({
  accounts: accountsReducer,
  auth: authReducer,
  bitcoin: bitcoinReducer,
  bridge: bridgeReducer,
  chat: chatReducer,
  contracts: contractReducer,
  conversations: conversationReducer,
  discord: discordReducer,
  documents: documentReducer,
  fabric: fabricReducer,
  files: fileReducer,
  github: githubReducer,
  groups: groupsReducer,
  stats: adminReducer,
  matrix: matrixReducer,
  people: personReducer,
  inquiries: inquiriesReducer,
  invitation: invitationReducer,
  search: searchReducer,
  feedback: feedbackReducer,
  help: helpReducer,
  peers: peersReducer,
  redis: redisReducer,
  sources: sourcesReducer,
  tasks: tasksReducer,
  users: accountsReducer,
  wallet: walletReducer
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
