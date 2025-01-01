'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/fabric', {
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
const FETCH_FABRIC_STATS_REQUEST = 'FETCH_FABRIC_STATS_REQUEST';
const FETCH_FABRIC_STATS_SUCCESS = 'FETCH_FABRIC_STATS_SUCCESS';
const FETCH_FABRIC_STATS_FAILURE = 'FETCH_FABRIC_STATS_FAILURE';

// Action creators
const fetchFabricStatsRequest = () => ({ type: FETCH_FABRIC_STATS_REQUEST });
const fetchFabricStatsSuccess = (stats) => ({ type: FETCH_FABRIC_STATS_SUCCESS, payload: stats });
const fetchFabricStatsFailure = (error) => ({ type: FETCH_FABRIC_STATS_FAILURE, payload: error });

// Thunk action creator
const fetchFabricStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchFabricStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchFabricStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchFabricStatsFailure(error));
    }
  };
};

module.exports = {
  fetchFabricStats,
  FETCH_FABRIC_STATS_REQUEST,
  FETCH_FABRIC_STATS_SUCCESS,
  FETCH_FABRIC_STATS_FAILURE
};
