'use strict';

const fetch = require('cross-fetch');

// Action Types
const CHAT_REQUEST = 'CHAT_REQUEST';
const CHAT_SUCCESS = 'CHAT_SUCCESS';
const CHAT_FAILURE = 'CHAT_FAILURE';

// Sync Action Creators
const messageRequest = () => ({ type: CHAT_REQUEST, isSending: true });
const messageSuccess = message => ({ type: CHAT_SUCCESS, payload: { message }, isSending: false });
const messageFailure = error => ({ type: CHAT_FAILURE, payload: error, error: error, isSending: false });

// Async Action Creator (Thunk)
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
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      console.log('got result:', result);
      dispatch(messageSuccess(result.message));
    } catch (error) {
      dispatch(messageFailure(error.message));
    }
  };
};

module.exports = {
  submitMessage,
  CHAT_SUCCESS,
  CHAT_FAILURE,
  CHAT_REQUEST
};
