'use strict';

const {
  FETCH_FABRIC_STATS_REQUEST,
  FETCH_FABRIC_STATS_SUCCESS,
  FETCH_FABRIC_STATS_FAILURE
} = require('../actions/fabricActions');

const initialState = {
  error: null,
  loading: true,
  syncActive: false,
  syncStatus: ''
};

function fabricReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_FABRIC_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_FABRIC_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_FABRIC_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = fabricReducer;
