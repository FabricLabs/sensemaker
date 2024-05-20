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

const FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST = 'FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST';
const FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS = 'FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS';
const FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE = 'FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE';

const FETCH_HELP_MESSAGES_REQUEST = 'FETCH_HELP_MESSAGES_REQUEST';
const FETCH_HELP_MESSAGES_SUCCESS = 'FETCH_HELP_MESSAGES_SUCCESS';
const FETCH_HELP_MESSAGES_FAILURE = 'FETCH_HELP_MESSAGES_FAILURE';

const FETCH_ADMIN_HELP_MESSAGES_REQUEST = 'FETCH_ADMIN_HELP_MESSAGES_REQUEST';
const FETCH_ADMIN_HELP_MESSAGES_SUCCESS = 'FETCH_ADMIN_HELP_MESSAGES_SUCCESS';
const FETCH_ADMIN_HELP_MESSAGES_FAILURE = 'FETCH_ADMIN_HELP_MESSAGES_FAILURE';

const SEND_HELP_MESSAGE_REQUEST = 'SEND_HELP_MESSAGE_REQUEST';
const SEND_HELP_MESSAGE_SUCCESS = 'SEND_HELP_MESSAGE_SUCCESS';
const SEND_HELP_MESSAGE_FAILURE = 'SEND_HELP_MESSAGE_FAILURE';

const CLEAR_HELP_MESSAGES_REQUEST = 'CLEAR_HELP_MESSAGES_REQUEST';
const CLEAR_HELP_MESSAGES_SUCCESS = 'CLEAR_HELP_MESSAGES_SUCCESS';
const CLEAR_HELP_MESSAGES_FAILURE = 'CLEAR_HELP_MESSAGES_FAILURE';

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

const fetchAdminHelpMessagesRequest = () => ({ type: FETCH_ADMIN_HELP_MESSAGES_REQUEST });
const fetchAdminHelpMessagesSuccess = (messages) => ({ type: FETCH_ADMIN_HELP_MESSAGES_SUCCESS, payload: messages });
const fetchAdminHelpMessagesFailure = (error) => ({ type: FETCH_ADMIN_HELP_MESSAGES_FAILURE, payload: error });

const sendHelpMessageRequest = () => ({ type: SEND_HELP_MESSAGE_REQUEST });
const sendHelpMessageSuccess = (conversation_id) => ({ type: SEND_HELP_MESSAGE_SUCCESS, payload: conversation_id });
const sendHelpMessageFailure = (error) => ({ type: SEND_HELP_MESSAGE_FAILURE, payload: error });

const clearHelpMessagesRequest = () => ({ type: CLEAR_HELP_MESSAGES_REQUEST });
const clearHelpMessagesSuccess = (conversation_id) => ({ type: CLEAR_HELP_MESSAGES_SUCCESS });
const clearHelpMessagesFailure = (error) => ({ type: CLEAR_HELP_MESSAGES_FAILURE, payload: error });


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

const fetchHelpMessages = (conversation_id, isAdmin = false) => {
  return async (dispatch, getState) => {
    // Define action creators based on isAdmin
    const actions = isAdmin ? {
      request: fetchAdminHelpMessagesRequest,
      success: fetchAdminHelpMessagesSuccess,
      failure: fetchAdminHelpMessagesFailure
    } : {
      request: fetchHelpMessagesRequest,
      success: fetchHelpMessagesSuccess,
      failure: fetchHelpMessagesFailure
    };

    dispatch(actions.request());
    const { token } = getState().auth;
    const url = `/messages/help/${conversation_id}`;  // Adjust the URL if necessary

    try {
      const messages = await fetchFromAPI(url, token);
      dispatch(actions.success(messages));
    } catch (error) {
      dispatch(actions.failure(error));
    }
  };
};

//this function will get a conversation_id, and the help_role (user,admin) of the messages from that conversation
//to mark them as read, if an user open a conversation that has messages, it will mark all the messages from the assistant as read
//and the same goes if an assistan opens that user's conversation it will mark the user's messages as read.
const markMessagesRead = (conversation_id, help_role) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    try {
      const response = await fetch(`/messages/help/${conversation_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ help_role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.log(error);
    }
  };
}

const sendHelpMessage = (content, conversation_id, help_role) => {
  return async (dispatch, getState) => {

    dispatch(sendHelpMessageRequest());
    const { token } = getState().auth;

    try {
      const response = await fetch(`/messages/help/${conversation_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, help_role })
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

const clearHelpMessages = () => {
  return async (dispatch) => {
    dispatch(clearHelpMessagesSuccess());
  };
}

module.exports = {
  fetchHelpConversations,
  fetchAdminHelpConversations,
  fetchHelpMessages,
  sendHelpMessage,
  markMessagesRead,
  clearHelpMessages,
  FETCH_HELP_CONVERSATIONS_REQUEST,
  FETCH_HELP_CONVERSATIONS_SUCCESS,
  FETCH_HELP_CONVERSATIONS_FAILURE,
  FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST,
  FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS,
  FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE,
  FETCH_HELP_MESSAGES_REQUEST,
  FETCH_HELP_MESSAGES_SUCCESS,
  FETCH_HELP_MESSAGES_FAILURE,
  FETCH_ADMIN_HELP_MESSAGES_REQUEST,
  FETCH_ADMIN_HELP_MESSAGES_SUCCESS,
  FETCH_ADMIN_HELP_MESSAGES_FAILURE,
  SEND_HELP_MESSAGE_REQUEST,
  SEND_HELP_MESSAGE_SUCCESS,
  SEND_HELP_MESSAGE_FAILURE,
  CLEAR_HELP_MESSAGES_REQUEST,
  CLEAR_HELP_MESSAGES_SUCCESS,
  CLEAR_HELP_MESSAGES_FAILURE,
};
