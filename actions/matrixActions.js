'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/matrix', {
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
const FETCH_MATRIX_STATS_REQUEST = 'FETCH_MATRIX_STATS_REQUEST';
const FETCH_MATRIX_STATS_SUCCESS = 'FETCH_MATRIX_STATS_SUCCESS';
const FETCH_MATRIX_STATS_FAILURE = 'FETCH_MATRIX_STATS_FAILURE';

// Action creators
const fetchMatrixStatsRequest = () => ({ type: FETCH_MATRIX_STATS_REQUEST });
const fetchMatrixStatsSuccess = (stats) => ({ type: FETCH_MATRIX_STATS_SUCCESS, payload: stats });
const fetchMatrixStatsFailure = (error) => ({ type: FETCH_MATRIX_STATS_FAILURE, payload: error });

// Thunk action creator
const fetchMatrixStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchMatrixStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchMatrixStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchMatrixStatsFailure(error));
    }
  };
};

module.exports = {
  fetchMatrixStats,
  FETCH_MATRIX_STATS_REQUEST,
  FETCH_MATRIX_STATS_SUCCESS,
  FETCH_MATRIX_STATS_FAILURE
};
