'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchConversationsFromAPI(token, params = {}) {
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

const EDIT_TITLE_REQUEST = 'EDIT_TITLE_REQUEST';
const EDIT_TITLE_SUCCESS = 'EDIT_TITLE_SUCCESS';
const EDIT_TITLE_FAILURE = 'EDIT_TITLE_FAILURE';


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

const conversationTitlEditRequest = () => ({ type: EDIT_TITLE_REQUEST });
const conversationTitleEditSuccess = () => ({ type: EDIT_TITLE_SUCCESS});
const conversationTitleEditFailure = (error) => ({ type: EDIT_TITLE_FAILURE, payload: error });

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
      const conversations = await fetch(`/matter/conversations/${matterID}`, {
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
      if (response.ok) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        dispatch(conversationTitleEditSuccess());
      } else {
        error('API request failed with status:', response.status);
      }
    } catch (error) {
      dispatch(conversationTitleEditFailure(error));
    }
  }
}



module.exports = {
  fetchConversation,
  fetchConversations,
  fetchMatterConversations,
  conversationTitleEdit,
  FETCH_CONVERSATION_REQUEST,
  FETCH_CONVERSATION_SUCCESS,
  FETCH_CONVERSATION_FAILURE,
  FETCH_CONVERSATIONS_REQUEST,
  FETCH_CONVERSATIONS_SUCCESS,
  FETCH_CONVERSATIONS_FAILURE,
  FETCH_MATTER_CONVERSATIONS_REQUEST,
  FETCH_MATTER_CONVERSATIONS_SUCCESS,
  FETCH_MATTER_CONVERSATIONS_FAILURE,
  EDIT_TITLE_REQUEST,
  EDIT_TITLE_SUCCESS,
  EDIT_TITLE_FAILURE,
};
