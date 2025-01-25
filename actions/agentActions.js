'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/agents', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchAgentFromAPI (id, token) {
  const response = await fetch(`/agents/${id}`, {
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
const FETCH_AGENT_STATS_REQUEST = 'FETCH_AGENT_STATS_REQUEST';
const FETCH_AGENT_STATS_SUCCESS = 'FETCH_AGENT_STATS_SUCCESS';
const FETCH_AGENT_STATS_FAILURE = 'FETCH_AGENT_STATS_FAILURE';
const FETCH_AGENT_REQUEST = 'FETCH_AGENT_REQUEST';
const FETCH_AGENT_SUCCESS = 'FETCH_AGENT_SUCCESS';
const FETCH_AGENT_FAILURE = 'FETCH_AGENT_FAILURE';

// Action creators
const fetchAgentStatsRequest = () => ({ type: FETCH_AGENT_STATS_REQUEST });
const fetchAgentStatsSuccess = (stats) => ({ type: FETCH_AGENT_STATS_SUCCESS, payload: stats });
const fetchAgentStatsFailure = (error) => ({ type: FETCH_AGENT_STATS_FAILURE, payload: error });
const fetchAgentRequest = () => ({ type: FETCH_AGENT_REQUEST });
const fetchAgentSuccess = (stats) => ({ type: FETCH_AGENT_SUCCESS, payload: stats });
const fetchAgentFailure = (error) => ({ type: FETCH_AGENT_FAILURE, payload: error });

// Thunk action creator
const fetchAgentStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAgentStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchAgentStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchAgentStatsFailure(error));
    }
  };
};

const fetchAgent = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchAgentRequest());
    const { token } = getState().auth;
    try {
      const agent = await fetchAgentFromAPI(id, token);
      dispatch(fetchAgentSuccess(agent));
    } catch (error) {
      dispatch(fetchAgentFailure(error));
    }
  };
};

module.exports = {
  fetchAgentStats,
  fetchAgent,
  FETCH_AGENT_STATS_REQUEST,
  FETCH_AGENT_STATS_SUCCESS,
  FETCH_AGENT_STATS_FAILURE,
  FETCH_AGENT_REQUEST,
  FETCH_AGENT_SUCCESS,
  FETCH_AGENT_FAILURE
};
