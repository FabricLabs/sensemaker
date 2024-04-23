'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchHelpConversationsFromAPI(token, params = {}) {
  return fetchFromAPI('/conversations/help', params, token);
}

async function fetchAdminHelpConversationsFromAPI(token, params = {}) {
  return fetchFromAPI('/conversations/help/admin', params, token);
}

// Action types
const FETCH_HELP_CONVERSATIONS_REQUEST = 'FETCH_HELP_CONVERSATIONS_REQUEST';
const FETCH_HELP_CONVERSATIONS_SUCCESS = 'FETCH_HELP_CONVERSATIONS_SUCCESS';
const FETCH_HELP_CONVERSATIONS_FAILURE = 'FETCH_HELP_CONVERSATIONS_FAILURE';

const FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST = 'FETCH_HELP_CONVERSATIONS_REQUEST';
const FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS = 'FETCH_HELP_CONVERSATIONS_SUCCESS';
const FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE = 'FETCH_HELP_CONVERSATIONS_FAILURE';

const FETCH_HELP_MESSAGES_REQUEST = 'FETCH_HELP_MESSAGES_REQUEST';
const FETCH_HELP_MESSAGES_SUCCESS = 'FETCH_HELP_MESSAGES_SUCCESS';
const FETCH_HELP_MESSAGES_FAILURE = 'FETCH_HELP_MESSAGES_FAILURE';

const SEND_HELP_MESSAGE_REQUEST = 'SEND_MESSAGE_REQUEST';
const SEND_HELP_MESSAGE_SUCCESS = 'SEND_MESSAGE_SUCCESS';
const SEND_HELP_MESSAGE_FAILURE = 'SEND_MESSAGE_FAILURE';

// Action creators
const fetchHelpConversationsRequest = () => ({ type: FETCH_HELP_CONVERSATIONS_REQUEST });
const fetchHelpConversationsSuccess = (conversations) => ({ type: FETCH_HELP_CONVERSATIONS_SUCCESS, payload: conversations });
const fetchHelpConversationsFailure = (error) => ({ type: FETCH_HELP_CONVERSATIONS_FAILURE, payload: error });

const fetchAdminHelpConversationsRequest = () => ({ type: FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST });
const fetchAdminHelpConversationsSuccess = (conversations) => ({ type: FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS, payload: conversations });
const fetchAdminHelpConversationsFailure = (error) => ({ type: FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE, payload: error });

const fetchHelpMessagesRequest = () => ({ type: FETCH_HELP_MESSAGES_REQUEST });
const fetchHelpMessagesSuccess = (messages) => ({ type: FETCH_HELP_MESSAGES_SUCCESS, payload: messages });
const fetchHelpMessagesFailure = (error) => ({ type: FETCH_HELP_MESSAGES_FAILURE, payload: error });

const sendHelpMessageRequest = () => ({ type: SEND_HELP_MESSAGE_REQUEST });
const sendHelpMessageSuccess = (conversation_id) => ({ type: SEND_HELP_MESSAGE_SUCCESS, payload: conversation_id });
const sendHelpMessageFailure = (error) => ({ type: SEND_HELP_MESSAGE_FAILURE, payload: error });


// Thunk action creator
const fetchHelpConversations = () => {
  return async (dispatch, getState) => {
    dispatch(fetchHelpConversationsRequest());
    const { token } = getState().auth;
    try {
      const conversations = await fetchHelpConversationsFromAPI(token);
      dispatch(fetchHelpConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchHelpConversationsFailure(error));
    }
  };
};

const fetchAdminHelpConversations = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAdminHelpConversationsRequest());
    const { token } = getState().auth;
    try {
      const conversations = await fetchAdminHelpConversationsFromAPI(token);
      dispatch(fetchAdminHelpConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchAdminHelpConversationsFailure(error));
    }
  };
};

const fetchHelpMessages = (conversation_id) => {
  return async (dispatch, getState) => {
    dispatch(fetchHelpMessagesRequest());
    const { token } = getState().auth;
    try {
      const messages = await fetchFromAPI(`/messages/help/${conversation_id}`, token);
      dispatch(fetchHelpMessagesSuccess(messages));
    } catch (error) {
      dispatch(fetchHelpMessagesFailure(error));
    }
  };
};

const sendHelpMessage = (content, conversation_id, help_role) => {
  return async (dispatch, getState) => {

    dispatch(sendHelpMessageRequest());
    const { token } = getState().auth;

    try {
      console.log("data to send:", token,content,conversation_id,help_role);
      const response = await fetch(`/messages/help/${conversation_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({content, help_role})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      dispatch(sendHelpMessageSuccess(result.conversation_id));
    } catch (error) {
      dispatch(sendHelpMessageFailure(error));
    }
  };
};

module.exports = {
  fetchHelpConversations,
  fetchAdminHelpConversations,
  fetchHelpMessages,
  sendHelpMessage,
  FETCH_HELP_CONVERSATIONS_REQUEST,
  FETCH_HELP_CONVERSATIONS_SUCCESS,
  FETCH_HELP_CONVERSATIONS_FAILURE,
  FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST,
  FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS,
  FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE,
  FETCH_HELP_MESSAGES_REQUEST,
  FETCH_HELP_MESSAGES_SUCCESS,
  FETCH_HELP_MESSAGES_FAILURE,
  SEND_HELP_MESSAGE_REQUEST,
  SEND_HELP_MESSAGE_SUCCESS,
  SEND_HELP_MESSAGE_FAILURE,
};
