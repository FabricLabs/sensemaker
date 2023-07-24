'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
const authReducer = require('../reducers/authReducer');
const chatReducer = require('../reducers/chatReducer');
const contractReducer = require('../reducers/contractReducer');
const conversationReducer = require('../reducers/conversationReducer');

// Root
const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  contracts: contractReducer,
  conversations: conversationReducer
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
