'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
const adminReducer = require('../reducers/adminReducer');
const authReducer = require('../reducers/authReducer');
const caseReducer = require('../reducers/caseReducer');
const chatReducer = require('../reducers/chatReducer');
const contractReducer = require('../reducers/contractReducer');
const conversationReducer = require('../reducers/conversationReducer');
const courtReducer = require('../reducers/courtReducer');
const personReducer = require('../reducers/personReducer')

// Root
const rootReducer = combineReducers({
  auth: authReducer,
  cases: caseReducer,
  chat: chatReducer,
  contracts: contractReducer,
  conversations: conversationReducer,
  courts: courtReducer,
  stats: adminReducer,
  people: personReducer
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
