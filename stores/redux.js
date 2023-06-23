'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
const authReducer = require('../reducers/authReducer');
const conversationsReducer = require('../reducers/conversationReducer');

// Root
const rootReducer = combineReducers({
  auth: authReducer,
  conversations: conversationsReducer,
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
