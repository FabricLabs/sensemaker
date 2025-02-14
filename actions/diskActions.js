'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/disk', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchPathFromAPI (path, token) {
  const response = await fetch(`/services/disk/${path}`, {
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
const FETCH_DISK_STATS_REQUEST = 'FETCH_DISK_STATS_REQUEST';
const FETCH_DISK_STATS_SUCCESS = 'FETCH_DISK_STATS_SUCCESS';
const FETCH_DISK_STATS_FAILURE = 'FETCH_DISK_STATS_FAILURE';
const FETCH_DISK_PATH_REQUEST = 'FETCH_DISK_PATH_REQUEST';
const FETCH_DISK_PATH_SUCCESS = 'FETCH_DISK_PATH_SUCCESS';
const FETCH_DISK_PATH_FAILURE = 'FETCH_DISK_PATH_FAILURE';

// Action creators
const fetchDiskStatsRequest = () => ({ type: FETCH_DISK_STATS_REQUEST });
const fetchDiskStatsSuccess = (stats) => ({ type: FETCH_DISK_STATS_SUCCESS, payload: stats });
const fetchDiskStatsFailure = (error) => ({ type: FETCH_DISK_STATS_FAILURE, payload: error });
const fetchDiskPathRequest = () => ({ type: FETCH_DISK_PATH_REQUEST });
const fetchDiskPathSuccess = (file) => ({ type: FETCH_DISK_PATH_SUCCESS, payload: file });
const fetchDiskPathFailure = (error) => ({ type: FETCH_DISK_PATH_FAILURE, payload: error });

// Thunk action creator
const fetchDiskStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDiskStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchDiskStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchDiskStatsFailure(error));
    }
  };
};

const fetchDiskPath = (path) => {
  return async (dispatch, getState) => {
    dispatch(fetchDiskPathRequest());
    const { token } = getState().auth;
    try {
      const file = await fetchPathFromAPI(path, token);
      dispatch(fetchDiskPathSuccess(file));
    } catch (error) {
      dispatch(fetchDiskPathFailure(error));
    }
  };
};

module.exports = {
  fetchDiskPath,
  fetchDiskStats,
  FETCH_DISK_STATS_REQUEST,
  FETCH_DISK_STATS_SUCCESS,
  FETCH_DISK_STATS_FAILURE,
  FETCH_DISK_PATH_REQUEST,
  FETCH_DISK_PATH_SUCCESS,
  FETCH_DISK_PATH_FAILURE
};
