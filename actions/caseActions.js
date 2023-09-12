'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchCasesFromAPI (token) {
  return fetchFromAPI('/cases', token);
}

// Action types
const FETCH_CASES_REQUEST = 'FETCH_CASES_REQUEST';
const FETCH_CASES_SUCCESS = 'FETCH_CASES_SUCCESS';
const FETCH_CASES_FAILURE = 'FETCH_CASES_FAILURE';
const FETCH_CASE_REQUEST = 'FETCH_CASE_REQUEST';
const FETCH_CASE_SUCCESS = 'FETCH_CASE_SUCCESS';
const FETCH_CASE_FAILURE = 'FETCH_CASE_FAILURE';

// Action creators
const fetchCasesRequest = () => ({ type: FETCH_CASES_REQUEST, loading: true });
const fetchCasesSuccess = (cases) => ({ type: FETCH_CASES_SUCCESS, payload: cases, loading: false });
const fetchCasesFailure = (error) => ({ type: FETCH_CASES_FAILURE, payload: error, loading: false  });
const fetchCaseRequest = () => ({ type: FETCH_CASE_REQUEST, loading: true });
const fetchCaseSuccess = (instance) => ({ type: FETCH_CASE_SUCCESS, payload: instance, loading: false });
const fetchCaseFailure = (error) => ({ type: FETCH_CASE_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchCases = () => {
  return async (dispatch, getState) => {
    dispatch(fetchCasesRequest());
    const { token } = getState().auth;
    try {
      const cases = await fetchCasesFromAPI(token);
      dispatch(fetchCasesSuccess(cases));
    } catch (error) {
      dispatch(fetchCasesFailure(error));
    }
  };
};

const fetchCase = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchCaseRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/cases/${id}`, token);
      dispatch(fetchCaseSuccess(instance));
    } catch (error) {
      dispatch(fetchCaseFailure(error));
    }
  };
};

module.exports = {
  fetchCase,
  fetchCases,
  FETCH_CASE_REQUEST,
  FETCH_CASE_SUCCESS,
  FETCH_CASE_FAILURE,
  FETCH_CASES_REQUEST,
  FETCH_CASES_SUCCESS,
  FETCH_CASES_FAILURE
};
