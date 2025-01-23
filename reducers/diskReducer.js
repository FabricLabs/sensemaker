'use strict';

const {
  FETCH_DISK_STATS_REQUEST,
  FETCH_DISK_STATS_SUCCESS,
  FETCH_DISK_STATS_FAILURE,
  FETCH_DISK_PATH_REQUEST,
  FETCH_DISK_PATH_SUCCESS,
  FETCH_DISK_PATH_FAILURE
} = require('../actions/diskActions');

const initialState = {
  error: null,
  file: {},
  files: [],
  loading: true,
  syncActive: false,
  syncStatus: ''
};

function diskReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_DISK_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_DISK_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_DISK_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISK_PATH_REQUEST:
      return { ...state }; // reset state
    case FETCH_DISK_PATH_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_DISK_PATH_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = diskReducer;
