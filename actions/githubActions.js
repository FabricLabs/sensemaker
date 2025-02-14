'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/github', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

// Action types
const FETCH_GITHUB_STATS_REQUEST = 'FETCH_GITHUB_STATS_REQUEST';
const FETCH_GITHUB_STATS_SUCCESS = 'FETCH_GITHUB_STATS_SUCCESS';
const FETCH_GITHUB_STATS_FAILURE = 'FETCH_GITHUB_STATS_FAILURE';

// Action creators
const fetchGitHubStatsRequest = () => ({ type: FETCH_GITHUB_STATS_REQUEST });
const fetchGitHubStatsSuccess = (stats) => ({ type: FETCH_GITHUB_STATS_SUCCESS, payload: stats });
const fetchGitHubStatsFailure = (error) => ({ type: FETCH_GITHUB_STATS_FAILURE, payload: error });

// Thunk action creator
const fetchGitHubStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchGitHubStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchGitHubStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchGitHubStatsFailure(error));
    }
  };
};

module.exports = {
  fetchGitHubStats,
  FETCH_GITHUB_STATS_REQUEST,
  FETCH_GITHUB_STATS_SUCCESS,
  FETCH_GITHUB_STATS_FAILURE
};
