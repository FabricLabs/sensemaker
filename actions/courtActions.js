'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchCourtsFromAPI (token) {
  return fetchFromAPI('/courts', null, token);
}

// Action types
const FETCH_COURTS_REQUEST = 'FETCH_COURTS_REQUEST';
const FETCH_COURTS_SUCCESS = 'FETCH_COURTS_SUCCESS';
const FETCH_COURTS_FAILURE = 'FETCH_COURTS_FAILURE';
const FETCH_COURT_REQUEST = 'FETCH_COURT_REQUEST';
const FETCH_COURT_SUCCESS = 'FETCH_COURT_SUCCESS';
const FETCH_COURT_FAILURE = 'FETCH_COURT_FAILURE';

// Action creators
const fetchCourtsRequest = () => ({ type: FETCH_COURTS_REQUEST, loading: true });
const fetchCourtsSuccess = (courts) => ({ type: FETCH_COURTS_SUCCESS, payload: courts, loading: false });
const fetchCourtsFailure = (error) => ({ type: FETCH_COURTS_FAILURE, payload: error, loading: false  });
const fetchCourtRequest = () => ({ type: FETCH_COURT_REQUEST, loading: true });
const fetchCourtSuccess = (instance) => ({ type: FETCH_COURT_SUCCESS, payload: instance, loading: false });
const fetchCourtFailure = (error) => ({ type: FETCH_COURT_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchCourts = () => {
  return async (dispatch, getState) => {
    dispatch(fetchCourtsRequest());
    const { token } = getState().auth;
    try {
      const courts = await fetchCourtsFromAPI(token);
      dispatch(fetchCourtsSuccess(courts));
    } catch (error) {
      dispatch(fetchCourtsFailure(error));
    }
  };
};

const fetchCourt = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchCourtRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/courts/${id}`, null, token);
      dispatch(fetchCourtSuccess(instance));
    } catch (error) {
      dispatch(fetchCourtFailure(error));
    }
  };
};

module.exports = {
  fetchCourt,
  fetchCourts,
  FETCH_COURT_REQUEST,
  FETCH_COURT_SUCCESS,
  FETCH_COURT_FAILURE,
  FETCH_COURTS_REQUEST,
  FETCH_COURTS_SUCCESS,
  FETCH_COURTS_FAILURE
};
