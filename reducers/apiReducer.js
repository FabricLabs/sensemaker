'use strict';

const {
  FETCH_RESOURCE_REQUEST,
  FETCH_RESOURCE_SUCCESS,
  FETCH_RESOURCE_FAILURE
} = require('../actions/apiActions');

const initialState = {
  error: null,
  loading: true,
  syncActive: false,
  syncStatus: '',
  resource: {}
};

function apiReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_RESOURCE_REQUEST:
      return { ...state }; // reset state
    case FETCH_RESOURCE_SUCCESS:
      return { ...state, resource: action.payload, loading: false };
    case FETCH_RESOURCE_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = apiReducer;
