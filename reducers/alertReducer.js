'use strict';

const {
  FETCH_ALERTS_REQUEST,
  FETCH_ALERTS_SUCCESS,
  FETCH_ALERTS_FAILURE
} = require('../actions/alertActions');

const initialState = {
  alerts: [],
  error: null,
  loading: false
};

function alertReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_ALERTS_REQUEST:
      return { ...state, loading: true };
    case FETCH_ALERTS_SUCCESS:
      return { ...state, alerts: action.payload, loading: false };
    case FETCH_ALERTS_FAILURE:
      console.debug('fetch alerts failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = alertReducer; 