'use strict';

const {
  FETCH_GITHUB_STATS_REQUEST,
  FETCH_GITHUB_STATS_SUCCESS,
  FETCH_GITHUB_STATS_FAILURE
} = require('../actions/githubActions');

const initialState = {
  error: null,
  loading: true,
  syncActive: false,
  syncStatus: ''
};

function githubReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_GITHUB_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_GITHUB_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_GITHUB_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = githubReducer;
