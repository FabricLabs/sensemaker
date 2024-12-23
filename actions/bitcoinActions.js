'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/bitcoin', {
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
const FETCH_BITCOIN_STATS_REQUEST = 'FETCH_BITCOIN_STATS_REQUEST';
const FETCH_BITCOIN_STATS_SUCCESS = 'FETCH_BITCOIN_STATS_SUCCESS';
const FETCH_BITCOIN_STATS_FAILURE = 'FETCH_BITCOIN_STATS_FAILURE';

// Action creators
const fetchBitcoinStatsRequest = () => ({ type: FETCH_BITCOIN_STATS_REQUEST });
const fetchBitcoinStatsSuccess = (stats) => ({ type: FETCH_BITCOIN_STATS_SUCCESS, payload: stats });
const fetchBitcoinStatsFailure = (error) => ({ type: FETCH_BITCOIN_STATS_FAILURE, payload: error });

// Thunk action creator
const fetchBitcoinStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchBitcoinStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchBitcoinStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchBitcoinStatsFailure(error));
    }
  };
};

module.exports = {
  fetchBitcoinStats,
  FETCH_BITCOIN_STATS_REQUEST,
  FETCH_BITCOIN_STATS_SUCCESS,
  FETCH_BITCOIN_STATS_FAILURE
};
