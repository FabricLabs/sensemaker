'use strict';

// Actions
const {
  CHAT_REQUEST,
  CHAT_SUCCESS,
  CHAT_FAILURE,
  GET_MESSAGES_REQUEST,
  GET_MESSAGES_SUCCESS,
  GET_MESSAGES_FAILURE,
  FETCH_RESPONSE_REQUEST,
  FETCH_RESPONSE_SUCCESS,
  FETCH_RESPONSE_FAILURE,
  RESET_CHAT_STATE,
  RESET_CHAT_SUCCESS,
  CHAT_STREAM_CHUNK,
  CHAT_STREAM_RESET
} = require('../actions/chatActions');

// State
const initialState = {
  error: null,
  message: '',
  messages: [],
  isMessageSent: false,
  isSending: false,
  streamBuffer: '',
  streamMessageId: null
};

// Reducer
function chatReducer (state = initialState, action) {
  switch (action.type) {
    case CHAT_REQUEST:
      return {
        ...state,
        message: '',
        error: null,
        isSending: true,
        streamBuffer: '',
        streamMessageId: null
      };
    case CHAT_SUCCESS:
      return {
        ...state,
        message: action.payload.message.object,
        isMessageSent: true,
        isSending: false
      };
    case CHAT_FAILURE:
      return {
        ...state,
        error: action.payload,
        isMessageSent: false,
        isSending: false,
        streamBuffer: '',
        streamMessageId: null
      };
    case GET_MESSAGES_SUCCESS: {
      const messages = action.payload.messages;
      const last = messages && messages[messages.length - 1];
      const assistantSettled = last && last.role === 'assistant' && (last.status === 'ready' || last.status === 'error');
      return {
        ...state,
        messages,
        isSending: false,
        loading: false,
        ...(assistantSettled ? { streamBuffer: '', streamMessageId: null } : {})
      };
    }
    case FETCH_RESPONSE_REQUEST:
      return {
        ...state,
        isSending: true
      };
    case FETCH_RESPONSE_SUCCESS:
      return {
        ...state,
        isSending: false,
        response: action.payload
      };
    case FETCH_RESPONSE_FAILURE:
      return {
        ...state,
        error: action.payload,
        isSending: false
      };
    case CHAT_STREAM_CHUNK: {
      const { content = '', id = null } = action.payload || {};
      return {
        ...state,
        streamBuffer: state.streamBuffer + (typeof content === 'string' ? content : ''),
        streamMessageId: id != null ? id : state.streamMessageId
      };
    }
    case CHAT_STREAM_RESET:
      return {
        ...state,
        streamBuffer: '',
        streamMessageId: null
      };
    case RESET_CHAT_STATE:
    case RESET_CHAT_SUCCESS:
      return initialState;
    default:
      // console.warn('unhandled chat reducer action:', action);
      return state;
  }
}

module.exports = chatReducer;
