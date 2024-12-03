'use strict';

const {
  FETCH_KEYS_REQUEST,
  FETCH_KEYS_SUCCESS,
  FETCH_KEYS_FAILURE,
  CREATE_KEY_REQUEST,
  CREATE_KEY_SUCCESS,
  CREATE_KEY_FAILURE,
} = require('../actions/walletActions');

const initialState = {
  keys: [],
  error: null,
  loading: false,
  creating: false,
  createdSuccess: false,
  wallet: {
    keys: []
  }
};

function walletReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_KEYS_REQUEST:
      return { ...state, loading: true };
    case FETCH_KEYS_SUCCESS:
      return { ...state, keys: action.payload, wallet: { keys: action.payload }, loading: false };
    case FETCH_KEYS_FAILURE:
      console.debug('fetch keys failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    case CREATE_KEY_REQUEST:
      return { ...state, creating: true };
    case CREATE_KEY_SUCCESS:
      return { ...state, createdSuccess: true, creating: false };
    case CREATE_KEY_FAILURE:
      console.debug('fetch keys failure:', state, action);
      return { ...state, createdSuccess: false, error: action.payload, creating: false };
    default:
      return state;
  }
}

module.exports = walletReducer;
