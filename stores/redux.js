'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
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
const usersReducer = require('../reducers/usersReducer');
const searchReducer = require('../reducers/searchReducer');
const feedbackReducer = require('../reducers/feedbackReducer');
const helpReducer = require('../reducers/helpReducer');
const redisReducer = require('../reducers/redisReducer');

// Root
const rootReducer = combineReducers({
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
  users: usersReducer,
  search: searchReducer,
  feedback: feedbackReducer,
  help: helpReducer,
  redis: redisReducer,
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
