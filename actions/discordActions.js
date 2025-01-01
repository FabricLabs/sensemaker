'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/discord', {
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
const FETCH_DISCORD_STATS_REQUEST = 'FETCH_DISCORD_STATS_REQUEST';
const FETCH_DISCORD_STATS_SUCCESS = 'FETCH_DISCORD_STATS_SUCCESS';
const FETCH_DISCORD_STATS_FAILURE = 'FETCH_DISCORD_STATS_FAILURE';

// Action creators
const fetchDiscordStatsRequest = () => ({ type: FETCH_DISCORD_STATS_REQUEST });
const fetchDiscordStatsSuccess = (stats) => ({ type: FETCH_DISCORD_STATS_SUCCESS, payload: stats });
const fetchDiscordStatsFailure = (error) => ({ type: FETCH_DISCORD_STATS_FAILURE, payload: error });

// Thunk action creator
const fetchDiscordStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDiscordStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchDiscordStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchDiscordStatsFailure(error));
    }
  };
};

module.exports = {
  fetchDiscordStats,
  FETCH_DISCORD_STATS_REQUEST,
  FETCH_DISCORD_STATS_SUCCESS,
  FETCH_DISCORD_STATS_FAILURE
};
