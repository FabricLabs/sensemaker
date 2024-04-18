'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchConversationsFromAPI(token, params = {}) {
  return fetchFromAPI('/conversations', params, token);
}

// Action types
const FETCH_HELP_CONVERSATIONS_REQUEST = 'FETCH_HELP_CONVERSATIONS_REQUEST';
const FETCH_HELP_CONVERSATIONS_SUCCESS = 'FETCH_HELP_CONVERSATIONS_SUCCESS';
const FETCH_HELP_CONVERSATIONS_FAILURE = 'FETCH_HELP_CONVERSATIONS_FAILURE';

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

const fetchHelpMessagesRequest = () => ({ type: FETCH_HELP_MESSAGES_REQUEST });
const fetchHelpMessagesSuccess = (conversation) => ({ type: FETCH_HELP_MESSAGES_SUCCESS, payload: conversation });
const fetchHelpMessagesFailure = (error) => ({ type: FETCH_HELP_MESSAGES_FAILURE, payload: error });

const sendHelpMessageRequest = () => ({ type: SEND_HELP_MESSAGE_REQUEST });
const sendHelpMessageSuccess = () => ({ type: SEND_HELP_MESSAGE_SUCCESS });
const sendHelpMessageFailure = (error) => ({ type: SEND_HELP_MESSAGE_FAILURE, payload: error });


// Thunk action creator
const fetchHelpConversations = () => {
  return async (dispatch, getState) => {
    dispatch(fetchHelpConversationsRequest());
    const { token } = getState().auth;
    try {
      const conversations = await fetchConversationsFromAPI(token);
      dispatch(fetchHelpConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchHelpConversationsFailure(error));
    }
  };
};

const fetchConversation = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchConversationRequest());
    const { token } = getState().auth;
    try {
      const conversation = await fetchFromAPI(`/conversations/${id}`, token);
      dispatch(fetchConversationSuccess(conversation));
    } catch (error) {
      dispatch(fetchConversationFailure(error));
    }
  };
};

const fetchMatterConversations = (matterID) => {
  return async (dispatch, getState) => {
    dispatch(fetchMatterConversationsRequest());
    const { token } = getState().auth;
    try {
      const conversations = await fetch(`/matters/${matterID}/conversations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await conversations.json();
      dispatch(fetchMatterConversationsSuccess(data));
    } catch (error) {
      dispatch(fetchMatterConversationsFailure(error));
    }
  };
};

const conversationTitleEdit = (id, title) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    try {
      dispatch(conversationTitlEditRequest());
      const fetchPromise = fetch(`/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title }),
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Fetch timed out'));
        }, 15000);
      });
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      dispatch(conversationTitleEditSuccess());
    } catch (error) {
      dispatch(conversationTitleEditFailure(error));
    }
  }
}



module.exports = {
  fetchHelpConversations,
  fetchHelpMessages,
  sendHelpMessage,
  FETCH_HELP_CONVERSATIONS_REQUEST,
  FETCH_HELP_CONVERSATIONS_SUCCESS,
  FETCH_HELP_CONVERSATIONS_FAILURE,
  FETCH_HELP_MESSAGES_REQUEST,
  FETCH_HELP_MESSAGES_SUCCESS,
  FETCH_HELP_MESSAGES_FAILURE,
  SEND_HELP_MESSAGE_REQUEST,
  SEND_HELP_MESSAGE_SUCCESS,
  SEND_HELP_MESSAGE_FAILURE,
};
