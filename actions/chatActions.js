'use strict';

const fetch = require('cross-fetch');

// Action Types
const CHAT_REQUEST = 'CHAT_REQUEST';
const CHAT_SUCCESS = 'CHAT_SUCCESS';
const CHAT_FAILURE = 'CHAT_FAILURE';
const GET_MESSAGES_REQUEST = 'GET_MESSAGES_REQUEST';
const GET_MESSAGES_SUCCESS = 'GET_MESSAGES_SUCCESS';
const GET_MESSAGES_FAILURE = 'GET_MESSAGES_FAILURE';
const RESET_CHAT_STATE = 'RESET_CHAT_STATE';
const RESET_CHAT_SUCCESS = 'RESET_CHAT_SUCCESS';

// Sync Action Creators
const messageRequest = () => ({ type: CHAT_REQUEST, isSending: true });
const messageSuccess = (message) => ({ type: CHAT_SUCCESS, payload: { message }, isSending: false });
const messageFailure = (error) => ({ type: CHAT_FAILURE, payload: error, error: error, isSending: false });
const getMessagesRequest = () => ({ type: GET_MESSAGES_REQUEST, isSending: true });
const getMessagesSuccess = (messages) => ({ type: GET_MESSAGES_SUCCESS, payload: { messages }, isSending: false });
const getMessagesFailure = (error) => ({ type: GET_MESSAGES_FAILURE, payload: error, error: error, isSending: false });
const resetChatSuccess = () => ({ type: RESET_CHAT_SUCCESS });

// Async Action Creator (Thunk)
const resetChat = (message) => {
  return async (dispatch, getState) => {
    dispatch(resetChatSuccess());
  };
}

const submitMessage = (message) => {
  return async (dispatch, getState) => {
    dispatch(messageRequest());

    const token = getState().auth.token;

    try {
      const response = await fetch('/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      dispatch(messageSuccess(result));
    } catch (error) {
      dispatch(messageFailure(error.message));
    }
  };
};

const regenAnswer = (message) => {
  return async (dispatch, getState) => {
    dispatch(messageRequest());

    const token = getState().auth.token;

    try {
      const response = await fetch('/messagesRegen', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      dispatch(messageSuccess(result));
    } catch (error) {
      dispatch(messageFailure(error.message));
    }
  };
};

const getMessages = (params = {}) => {
  return async (dispatch, getState) => {
    dispatch(getMessagesRequest());

    const state = getState();
    const token = state.auth.token;

    if (!params.conversation_id) params.conversation_id = state.chat.message.conversation;

    try {
      const response = await fetch('/messages?' + new URLSearchParams(params), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();

      dispatch(getMessagesSuccess(result));
    } catch (error) {
      dispatch(getMessagesFailure(error.message));
    }
  };
};

module.exports = {
  resetChat,
  submitMessage,
  getMessages,
  regenAnswer,
  CHAT_SUCCESS,
  CHAT_FAILURE,
  CHAT_REQUEST,
  GET_MESSAGES_REQUEST,
  GET_MESSAGES_SUCCESS,
  GET_MESSAGES_FAILURE,
  RESET_CHAT_STATE,
  RESET_CHAT_SUCCESS
};
