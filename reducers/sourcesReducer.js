'use strict';

const {
  FETCH_SOURCE_REQUEST,
  FETCH_SOURCE_SUCCESS,
  FETCH_SOURCE_FAILURE,
  FETCH_SOURCES_REQUEST,
  FETCH_SOURCES_SUCCESS,
  FETCH_SOURCES_FAILURE,
} = require('../actions/sourceActions');

const initialState = {
  sources: [],
  current: {},
  loading: false,
  error: null
};

function accountsReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_SOURCE_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_SOURCE_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_SOURCE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_SOURCES_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_SOURCES_SUCCESS:
      return { ...state, loading: false, sources: action.payload };
    case FETCH_SOURCES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in sources reducer:', action);
      return state;
  }
}

module.exports = accountsReducer;
