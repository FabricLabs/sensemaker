'use strict';

// Dependencies
const { createStore, combineReducers, applyMiddleware } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

// Reducers
const adminReducer = require('../reducers/adminReducer');
const authReducer = require('../reducers/authReducer');
const bridgeReducer = require('../reducers/bridgeReducer');
const caseReducer = require('../reducers/caseReducer');
const chatReducer = require('../reducers/chatReducer');
const contractReducer = require('../reducers/contractReducer');
const conversationReducer = require('../reducers/conversationReducer');
const courtReducer = require('../reducers/courtReducer');
const documentReducer = require('../reducers/documentReducer');
const inquiriesReducer = require('../reducers/inquiriesReducer');
const invitationReducer = require('../reducers/invitationReducer');
const personReducer = require('../reducers/personReducer');
const opinionReducer = require('../reducers/opinionReducer');
const judgeReducer = require('../reducers/judgeReducer');
const volumeReducer = require('../reducers/volumeReducer');

// Root
const rootReducer = combineReducers({
  auth: authReducer,
  bridge: bridgeReducer,
  cases: caseReducer,
  chat: chatReducer,
  contracts: contractReducer,
  conversations: conversationReducer,
  courts: courtReducer,
  documents: documentReducer,
  stats: adminReducer,
  people: personReducer,
  opinions: opinionReducer,
  judges: judgeReducer,
  volumes: volumeReducer
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
