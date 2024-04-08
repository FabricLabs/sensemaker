'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchCasesFromAPI(token) {
  // TODO: pagination
  return fetchFromAPI('/cases', null, token);
}

// Action types
const FETCH_CASES_REQUEST = 'FETCH_CASES_REQUEST';
const FETCH_CASES_SUCCESS = 'FETCH_CASES_SUCCESS';
const FETCH_CASES_FAILURE = 'FETCH_CASES_FAILURE';
const FETCH_CASE_REQUEST = 'FETCH_CASE_REQUEST';
const FETCH_CASE_SUCCESS = 'FETCH_CASE_SUCCESS';
const FETCH_CASE_FAILURE = 'FETCH_CASE_FAILURE';
const SEARCH_CASE_REQUEST = 'SEARCH_CASE_REQUEST';
const SEARCH_CASE_SUCCESS = 'SEARCH_CASE_SUCCESS';
const SEARCH_CASE_FAILURE = 'SEARCH_CASE_FAILURE';

// Action creators
const fetchCasesRequest = () => ({ type: FETCH_CASES_REQUEST, loading: true });
const fetchCasesSuccess = (cases) => ({ type: FETCH_CASES_SUCCESS, payload: cases, loading: false });
const fetchCasesFailure = (error) => ({ type: FETCH_CASES_FAILURE, payload: error, loading: false });

const fetchCaseRequest = () => ({ type: FETCH_CASE_REQUEST, loading: true });
const fetchCaseSuccess = (instance) => ({ type: FETCH_CASE_SUCCESS, payload: instance, loading: false });
const fetchCaseFailure = (error) => ({ type: FETCH_CASE_FAILURE, payload: error, loading: false });

const searchCaseRequest = () => ({ type: SEARCH_CASE_REQUEST});
const searchCaseSuccess = (results) => ({ type: SEARCH_CASE_SUCCESS, payload: results});
const searchCaseFailure = (error) => ({ type: SEARCH_CASE_FAILURE, payload: error });


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
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/cases/${id}`, null, token);
      dispatch(fetchCaseSuccess(instance));
    } catch (error) {
      dispatch(fetchCaseFailure(error));
    }
  };
};

const searchCase = (query) => {
  return async (dispatch, getState) => {
    dispatch(searchCaseRequest());
    const { token } = getState().auth;
    try {
      let results;

      await fetch('/cases', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'SEARCH',
        body: JSON.stringify({ query })
      }).then(async (result) => {
        const obj = await result.json();
        console.debug('fetch result: ', obj);

        results = obj.content;

      }).finally(() => {
        dispatch(searchCaseSuccess(results));
      });
    } catch (error) {
      dispatch(searchCaseFailure(error.message));
    }
  }
}

module.exports = {
  fetchCase,
  fetchCases,
  searchCase,
  FETCH_CASE_REQUEST,
  FETCH_CASE_SUCCESS,
  FETCH_CASE_FAILURE,
  SEARCH_CASE_REQUEST,
  SEARCH_CASE_SUCCESS,
  SEARCH_CASE_FAILURE,
  FETCH_CASES_REQUEST,
  FETCH_CASES_SUCCESS,
  FETCH_CASES_FAILURE
};
