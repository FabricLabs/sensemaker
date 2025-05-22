'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
async function fetchAlertsFromAPI() {
  const response = await fetch('/alerts', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
}

// Action types
const FETCH_ALERTS_REQUEST = 'FETCH_ALERTS_REQUEST';
const FETCH_ALERTS_SUCCESS = 'FETCH_ALERTS_SUCCESS';
const FETCH_ALERTS_FAILURE = 'FETCH_ALERTS_FAILURE';

// Action creators
const fetchAlertsRequest = () => ({ type: FETCH_ALERTS_REQUEST });
const fetchAlertsSuccess = (alerts) => ({ type: FETCH_ALERTS_SUCCESS, payload: alerts });
const fetchAlertsFailure = (error) => ({ type: FETCH_ALERTS_FAILURE, payload: error });

// Thunk action creator
const fetchAlerts = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAlertsRequest());
    try {
      const alerts = await fetchAlertsFromAPI();
      dispatch(fetchAlertsSuccess(alerts));
    } catch (error) {
      dispatch(fetchAlertsFailure(error));
    }
  };
};

module.exports = {
  fetchAlerts,
  FETCH_ALERTS_REQUEST,
  FETCH_ALERTS_SUCCESS,
  FETCH_ALERTS_FAILURE
}; 