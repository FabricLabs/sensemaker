'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');
const sdk = require('matrix-js-sdk');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/matrix', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchRoomFromAPI (id, token) {
  const response = await fetch(`/services/matrix/rooms/${id}`, {
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
const AUTHENTICATE_MATRIX_REQUEST = 'AUTHENTICATE_MATRIX_REQUEST';
const AUTHENTICATE_MATRIX_SUCCESS = 'AUTHENTICATE_MATRIX_SUCCESS';
const AUTHENTICATE_MATRIX_FAILURE = 'AUTHENTICATE_MATRIX_FAILURE';
const FETCH_MATRIX_STATS_REQUEST = 'FETCH_MATRIX_STATS_REQUEST';
const FETCH_MATRIX_STATS_SUCCESS = 'FETCH_MATRIX_STATS_SUCCESS';
const FETCH_MATRIX_STATS_FAILURE = 'FETCH_MATRIX_STATS_FAILURE';
const FETCH_MATRIX_ROOM_REQUEST = 'FETCH_MATRIX_ROOM_REQUEST';
const FETCH_MATRIX_ROOM_SUCCESS = 'FETCH_MATRIX_ROOM_SUCCESS';
const FETCH_MATRIX_ROOM_FAILURE = 'FETCH_MATRIX_ROOM_FAILURE';

// Action creators
const authenticateMatrixRequest = () => ({ type: AUTHENTICATE_MATRIX_REQUEST });
const authenticateMatrixSuccess = (token) => ({ type: AUTHENTICATE_MATRIX_SUCCESS, payload: token });
const authenticateMatrixFailure = (error) => ({ type: AUTHENTICATE_MATRIX_FAILURE, payload: error });
const fetchMatrixStatsRequest = () => ({ type: FETCH_MATRIX_STATS_REQUEST });
const fetchMatrixStatsSuccess = (stats) => ({ type: FETCH_MATRIX_STATS_SUCCESS, payload: stats });
const fetchMatrixStatsFailure = (error) => ({ type: FETCH_MATRIX_STATS_FAILURE, payload: error });
const fetchMatrixRoomRequest = () => ({ type: FETCH_MATRIX_ROOM_REQUEST });
const fetchMatrixRoomSuccess = (stats) => ({ type: FETCH_MATRIX_ROOM_SUCCESS, payload: stats });
const fetchMatrixRoomFailure = (error) => ({ type: FETCH_MATRIX_ROOM_FAILURE, payload: error });

// Thunk action creator
const authenticateMatrix = (homeServer, username, password) => {
  return async (dispatch) => {
    dispatch(authenticateMatrixRequest());
    try {
      // Create matrix client with provided home server
      const client = sdk.createClient({
        baseUrl: homeServer
      });

      // Login with username/password
      const response = await client.login('m.login.password', {
        user: username,
        password: password,
      });

      // Store the access token
      dispatch(authenticateMatrixSuccess(response.access_token));

      return response;
    } catch (error) {
      dispatch(authenticateMatrixFailure(error.message || 'Authentication failed'));
      throw error;
    }
  };
};

const fetchMatrixStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchMatrixStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchMatrixStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchMatrixStatsFailure(error));
    }
  };
};

const fetchMatrixRoom = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchMatrixRoomRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchRoomFromAPI(token);
      dispatch(fetchMatrixRoomSuccess(stats));
    } catch (error) {
      dispatch(fetchMatrixRoomFailure(error));
    }
  };
};

module.exports = {
  authenticateMatrix,
  fetchMatrixStats,
  fetchMatrixRoom,
  AUTHENTICATE_MATRIX_REQUEST,
  AUTHENTICATE_MATRIX_SUCCESS,
  AUTHENTICATE_MATRIX_FAILURE,
  FETCH_MATRIX_STATS_REQUEST,
  FETCH_MATRIX_STATS_SUCCESS,
  FETCH_MATRIX_STATS_FAILURE,
  FETCH_MATRIX_ROOM_REQUEST,
  FETCH_MATRIX_ROOM_SUCCESS,
  FETCH_MATRIX_ROOM_FAILURE
};
