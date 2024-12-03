'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
const accountsReducer = require('../reducers/accountsReducer');
const adminReducer = require('../reducers/adminReducer');
const authReducer = require('../reducers/authReducer');
const bridgeReducer = require('../reducers/bridgeReducer');
const chatReducer = require('../reducers/chatReducer');
const contractReducer = require('../reducers/contractReducer');
const conversationReducer = require('../reducers/conversationReducer');
const documentReducer = require('../reducers/documentReducer');
const fileReducer = require('../reducers/fileReducer');
const inquiriesReducer = require('../reducers/inquiriesReducer');
const invitationReducer = require('../reducers/invitationReducer');
const personReducer = require('../reducers/personReducer');
const searchReducer = require('../reducers/searchReducer');
const tasksReducer = require('../reducers/tasksReducer');
const feedbackReducer = require('../reducers/feedbackReducer');
const helpReducer = require('../reducers/helpReducer');
const redisReducer = require('../reducers/redisReducer');
const walletReducer = require('../reducers/walletReducer');

// Root
const rootReducer = combineReducers({
  accounts: accountsReducer,
  auth: authReducer,
  bridge: bridgeReducer,
  chat: chatReducer,
  contracts: contractReducer,
  conversations: conversationReducer,
  documents: documentReducer,
  files: fileReducer,
  stats: adminReducer,
  people: personReducer,
  inquiries: inquiriesReducer,
  invitation: invitationReducer,
  search: searchReducer,
  feedback: feedbackReducer,
  help: helpReducer,
  redis: redisReducer,
  tasks: tasksReducer,
  users: accountsReducer,
  wallet: walletReducer
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
