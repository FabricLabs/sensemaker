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
const jurisdictionsReducer = require('../reducers/jurisdictionsReducer');
const documentReducer = require('../reducers/documentReducer');
const fileReducer = require('../reducers/fileReducer');
const inquiriesReducer = require('../reducers/inquiriesReducer');
const invitationReducer = require('../reducers/invitationReducer');
const personReducer = require('../reducers/personReducer');
const opinionReducer = require('../reducers/opinionReducer');
const judgeReducer = require('../reducers/judgeReducer');
const volumeReducer = require('../reducers/volumeReducer');
const mattersReducer = require('../reducers/mattersReducer');
const usersReducer = require('../reducers/usersReducer');
const searchReducer = require('../reducers/searchReducer');
const feedbackReducer = require('../reducers/feedbackReducer');
const reportersReducer = require('../reducers/reportersReducer');
const helpReducer = require('../reducers/helpReducer');

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
  files: fileReducer,
  stats: adminReducer,
  people: personReducer,
  opinions: opinionReducer,
  judges: judgeReducer,
  volumes: volumeReducer,
  inquiries: inquiriesReducer,
  invitation: invitationReducer,
  matters: mattersReducer,
  jurisdictions: jurisdictionsReducer,
  users: usersReducer,
  search: searchReducer,
  feedback: feedbackReducer,
  reporters: reportersReducer,
  help: helpReducer,
});

module.exports = createStore(rootReducer, applyMiddleware(thunkMiddleware));
