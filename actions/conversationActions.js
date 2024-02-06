'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchConversationsFromAPI (token, params = {}) {
  return fetchFromAPI('/conversations', params, token);
}

// Action types
const FETCH_CONVERSATIONS_REQUEST = 'FETCH_CONVERSATIONS_REQUEST';
const FETCH_CONVERSATIONS_SUCCESS = 'FETCH_CONVERSATIONS_SUCCESS';
const FETCH_CONVERSATIONS_FAILURE = 'FETCH_CONVERSATIONS_FAILURE';

const FETCH_CONVERSATION_REQUEST = 'FETCH_CONVERSATION_REQUEST';
const FETCH_CONVERSATION_SUCCESS = 'FETCH_CONVERSATION_SUCCESS';
const FETCH_CONVERSATION_FAILURE = 'FETCH_CONVERSATION_FAILURE';

const FETCH_MATTER_CONVERSATIONS_REQUEST = 'FETCH_MATTER_CONVERSATIONS_REQUEST';
const FETCH_MATTER_CONVERSATIONS_SUCCESS = 'FETCH_MATTER_CONVERSATIONS_SUCCESS';
const FETCH_MATTER_CONVERSATIONS_FAILURE = 'FETCH_MATTER_CONVERSATIONS_FAILURE';

// Action creators
const fetchConversationsRequest = () => ({ type: FETCH_CONVERSATIONS_REQUEST });
const fetchConversationsSuccess = (conversations) => ({ type: FETCH_CONVERSATIONS_SUCCESS, payload: conversations });
const fetchConversationsFailure = (error) => ({ type: FETCH_CONVERSATIONS_FAILURE, payload: error });

const fetchConversationRequest = () => ({ type: FETCH_CONVERSATION_REQUEST });
const fetchConversationSuccess = (conversation) => ({ type: FETCH_CONVERSATION_SUCCESS, payload: conversation });
const fetchConversationFailure = (error) => ({ type: FETCH_CONVERSATION_FAILURE, payload: error });

const fetchMatterConversationsRequest = () => ({ type: FETCH_MATTER_CONVERSATIONS_REQUEST });
const fetchMatterConversationsSuccess = (conversations) => ({ type: FETCH_MATTER_CONVERSATIONS_SUCCESS, payload: conversations });
const fetchMatterConversationsFailure = (error) => ({ type: FETCH_MATTER_CONVERSATIONS_FAILURE, payload: error });

// Thunk action creator
const fetchConversations = () => {
  return async (dispatch, getState) => {
    dispatch(fetchConversationsRequest());
    const { token } = getState().auth;
    try {
      const conversations = await fetchConversationsFromAPI(token);
      dispatch(fetchConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchConversationsFailure(error));
    }
  };
};

const fetchConversation = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchConversationRequest());
    const { token } = getState().auth.token;
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
    const { token } = getState().auth.token;
    console.log("fetch en el reducer",matterID,token);
    try {
      const conversations = await fetch(`/matter/conversations/${matterID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      dispatch(fetchMatterConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchMatterConversationsFailure(error));
    }
  };
};



module.exports = {
  fetchConversation,
  fetchConversations,
  fetchMatterConversations,
  FETCH_CONVERSATION_REQUEST,
  FETCH_CONVERSATION_SUCCESS,
  FETCH_CONVERSATION_FAILURE,
  FETCH_CONVERSATIONS_REQUEST,
  FETCH_CONVERSATIONS_SUCCESS,
  FETCH_CONVERSATIONS_FAILURE,
  FETCH_MATTER_CONVERSATIONS_REQUEST,
  FETCH_MATTER_CONVERSATIONS_SUCCESS,
  FETCH_MATTER_CONVERSATIONS_FAILURE
};
