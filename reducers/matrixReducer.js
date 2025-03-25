'use strict';

const {
  AUTHENTICATE_MATRIX_REQUEST,
  AUTHENTICATE_MATRIX_SUCCESS,
  AUTHENTICATE_MATRIX_FAILURE,
  FETCH_MATRIX_STATS_REQUEST,
  FETCH_MATRIX_STATS_SUCCESS,
  FETCH_MATRIX_STATS_FAILURE,
  FETCH_MATRIX_ROOM_REQUEST,
  FETCH_MATRIX_ROOM_SUCCESS,
  FETCH_MATRIX_ROOM_FAILURE
} = require('../actions/matrixActions');

const initialState = {
  error: null,
  loading: true,
  syncActive: false,
  syncStatus: ''
};

function matrixReducer (state = initialState, action) {
  switch (action.type) {
    case AUTHENTICATE_MATRIX_REQUEST:
      return { ...state }; // reset state
    case AUTHENTICATE_MATRIX_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case AUTHENTICATE_MATRIX_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_MATRIX_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_MATRIX_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_MATRIX_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_MATRIX_ROOM_REQUEST:
      return { ...state }; // reset state
    case FETCH_MATRIX_ROOM_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_MATRIX_ROOM_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = matrixReducer;
