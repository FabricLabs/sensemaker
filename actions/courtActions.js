'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchCourtsFromAPI (token) {
  return fetchFromAPI('/courts', null, token);
}

// Action types
const FETCH_CASES_REQUEST = 'FETCH_CASES_REQUEST';
const FETCH_CASES_SUCCESS = 'FETCH_CASES_SUCCESS';
const FETCH_CASES_FAILURE = 'FETCH_CASES_FAILURE';
const FETCH_CASE_REQUEST = 'FETCH_CASE_REQUEST';
const FETCH_CASE_SUCCESS = 'FETCH_CASE_SUCCESS';
const FETCH_CASE_FAILURE = 'FETCH_CASE_FAILURE';

// Action creators
const fetchCourtsRequest = () => ({ type: FETCH_CASES_REQUEST, loading: true });
const fetchCourtsSuccess = (courts) => ({ type: FETCH_CASES_SUCCESS, payload: courts, loading: false });
const fetchCourtsFailure = (error) => ({ type: FETCH_CASES_FAILURE, payload: error, loading: false  });
const fetchCourtRequest = () => ({ type: FETCH_CASE_REQUEST, loading: true });
const fetchCourtSuccess = (instance) => ({ type: FETCH_CASE_SUCCESS, payload: instance, loading: false });
const fetchCourtFailure = (error) => ({ type: FETCH_CASE_FAILURE, payload: error, loading: false });

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
  FETCH_CASE_REQUEST,
  FETCH_CASE_SUCCESS,
  FETCH_CASE_FAILURE,
  FETCH_CASES_REQUEST,
  FETCH_CASES_SUCCESS,
  FETCH_CASES_FAILURE
};
