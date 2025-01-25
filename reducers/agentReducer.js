'use strict';

const {
  FETCH_AGENT_STATS_REQUEST,
  FETCH_AGENT_STATS_SUCCESS,
  FETCH_AGENT_STATS_FAILURE,
  FETCH_AGENT_REQUEST,
  FETCH_AGENT_SUCCESS,
  FETCH_AGENT_FAILURE
} = require('../actions/agentActions');

const initialState = {
  error: null,
  loading: true,
  syncActive: false,
  syncStatus: '',
  agent: {},
  agents: []
};

function diskReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_AGENT_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_AGENT_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_AGENT_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_AGENT_REQUEST:
      return { ...state }; // reset state
    case FETCH_AGENT_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_AGENT_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = diskReducer;
