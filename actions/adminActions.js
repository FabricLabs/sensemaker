'use strict';

const { fetchFromAPI } = require('./apiActions');

// API Functions
async function fetchStatsFromAPI (token) {
  const response = await fetch('/statistics/admin', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  return await response.json();
}

// Action types
const FETCH_ADMIN_STATS_REQUEST = 'FETCH_ADMIN_STATS_REQUEST';
const FETCH_ADMIN_STATS_SUCCESS = 'FETCH_ADMIN_STATS_SUCCESS';
const FETCH_ADMIN_STATS_FAILURE = 'FETCH_ADMIN_STATS_FAILURE';
const FETCH_ALL_CONVERSATIONS_SUCCESS = 'FETCH_ALL_CONVERSATIONS_SUCCESS';
const FETCH_ALL_CONVERSATIONS_FAILURE = 'FETCH_ALL_CONVERSATIONS_FAILURE';

// Action creators
const fetchAdminStatsRequest = () => ({ type: FETCH_ADMIN_STATS_REQUEST });
const fetchAdminStatsSuccess = (stats) => ({ type: FETCH_ADMIN_STATS_SUCCESS, payload: stats });
const fetchAdminStatsFailure = (error) => ({ type: FETCH_ADMIN_STATS_FAILURE, payload: error });
const fetchAllConversationsSuccess = (conversations) => ({ type: FETCH_ALL_CONVERSATIONS_SUCCESS, payload: conversations });
const fetchAllConversationsFailure = (error) => ({ type: FETCH_ALL_CONVERSATIONS_FAILURE, payload: error });

// Thunk action creator
const fetchAdminStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAdminStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchAdminStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchAdminStatsFailure(error));
    }
  };
};

const fetchAllConversationsFromAPI = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAdminStatsRequest());
    const { token } = getState().auth;

    try {
      const conversations = await fetchFromAPI('/conversations', {
        query: {
          include: '*'
        }
      }, token);

      dispatch(fetchAllConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchAllConversationsFailure(error));
    }
  };
}

module.exports = {
  fetchAdminStats,
  fetchAllConversationsFromAPI,
  FETCH_ADMIN_STATS_REQUEST,
  FETCH_ADMIN_STATS_SUCCESS,
  FETCH_ADMIN_STATS_FAILURE
};
