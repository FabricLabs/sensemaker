'use strict';

// Actions
const {
  CHAT_REQUEST,
  CHAT_SUCCESS,
  CHAT_FAILURE,
  GET_MESSAGES_REQUEST,
  GET_MESSAGES_SUCCESS,
  GET_MESSAGES_FAILURE
} = require('../actions/chatActions');

// State
const initialState = {
  error: null,
  message: '',
  messages: [],
  isMessageSent: false,
  isSending: false
};

// Reducer
function chatReducer (state = initialState, action) {
  switch (action.type) {
    case CHAT_REQUEST:
      return {
        ...state,
        message: '',
        error: null,
        isSending: true
      };
    case CHAT_SUCCESS:
      console.debug('chat success:', state, action);
      return {
        ...state,
        message: action.payload.message,
        isMessageSent: true,
        isSending: false
      };
    case CHAT_FAILURE:
      console.debug('chat failure:', state, action);
      return {
        ...state,
        error: action.payload,
        isMessageSent: false,
        isSending: false
      };
    case GET_MESSAGES_SUCCESS:
      return {
        ...state,
        messages: action.payload.messages,
        isSending: false,
        loading: false
      };
    default:
      return state;
  }
}

module.exports = chatReducer;
