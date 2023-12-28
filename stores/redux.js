'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
const authReducer = require('../reducers/authReducer');
const caseReducer = require('../reducers/caseReducer');
const chatReducer = require('../reducers/chatReducer');
const contractReducer = require('../reducers/contractReducer');
const conversationReducer = require('../reducers/conversationReducer');
const courtReducer = require('../reducers/courtReducer');

// Root
const rootReducer = combineReducers({
  auth: authReducer,
  cases: caseReducer,
  chat: chatReducer,
  contracts: contractReducer,
  conversations: conversationReducer,
  courts: courtReducer
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
