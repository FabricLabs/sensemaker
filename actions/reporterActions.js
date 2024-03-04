'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchReportersFromAPI (token) {
  return fetchFromAPI('/reporters', null, token);
}

// Action types
const FETCH_REPORTERS_REQUEST = 'FETCH_REPORTERS_REQUEST';
const FETCH_REPORTERS_SUCCESS = 'FETCH_REPORTERS_SUCCESS';
const FETCH_REPORTERS_FAILURE = 'FETCH_REPORTERS_FAILURE';
const FETCH_REPORTER_REQUEST = 'FETCH_REPORTER_REQUEST';
const FETCH_REPORTER_SUCCESS = 'FETCH_REPORTER_SUCCESS';
const FETCH_REPORTER_FAILURE = 'FETCH_REPORTER_FAILURE';

// Action creators
const fetchReportersRequest = () => ({ type: FETCH_REPORTERS_REQUEST, loading: true });
const fetchReportersSuccess = (reporters) => ({ type: FETCH_REPORTERS_SUCCESS, payload: reporters, loading: false });
const fetchReportersFailure = (error) => ({ type: FETCH_REPORTERS_FAILURE, payload: error, loading: false  });
const fetchReporterRequest = () => ({ type: FETCH_REPORTER_REQUEST, loading: true });
const fetchReporterSuccess = (instance) => ({ type: FETCH_REPORTER_SUCCESS, payload: instance, loading: false });
const fetchReporterFailure = (error) => ({ type: FETCH_REPORTER_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchReporters = () => {
  return async (dispatch, getState) => {
    dispatch(fetchReportersRequest());
    const { token } = getState().auth;
    try {
      const reporters = await fetchReportersFromAPI(token);
      dispatch(fetchReportersSuccess(reporters));
    } catch (error) {
      dispatch(fetchReportersFailure(error));
    }
  };
};

const fetchReporter = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchReporterRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/reporters/${id}`, null, token);
      dispatch(fetchReporterSuccess(instance));
    } catch (error) {
      dispatch(fetchReporterFailure(error));
    }
  };
};

module.exports = {
  fetchReporter,
  fetchReporters,
  FETCH_REPORTER_REQUEST,
  FETCH_REPORTER_SUCCESS,
  FETCH_REPORTER_FAILURE,
  FETCH_REPORTERS_REQUEST,
  FETCH_REPORTERS_SUCCESS,
  FETCH_REPORTERS_FAILURE
};
