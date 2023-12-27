'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchJudgesFromAPI (token) {
  return fetchFromAPI('/judges', null, token);
}

// Action types
const FETCH_DOCUMENTS_REQUEST = 'FETCH_DOCUMENTS_REQUEST';
const FETCH_DOCUMENTS_SUCCESS = 'FETCH_DOCUMENTS_SUCCESS';
const FETCH_DOCUMENTS_FAILURE = 'FETCH_DOCUMENTS_FAILURE';
const FETCH_DOCUMENT_REQUEST = 'FETCH_DOCUMENT_REQUEST';
const FETCH_DOCUMENT_SUCCESS = 'FETCH_DOCUMENT_SUCCESS';
const FETCH_DOCUMENT_FAILURE = 'FETCH_DOCUMENT_FAILURE';

// Action creators
const fetchJudgesRequest = () => ({ type: FETCH_DOCUMENTS_REQUEST, loading: true });
const fetchJudgesSuccess = (judges) => ({ type: FETCH_DOCUMENTS_SUCCESS, payload: judges, loading: false });
const fetchJudgesFailure = (error) => ({ type: FETCH_DOCUMENTS_FAILURE, payload: error, loading: false  });
const fetchJudgeRequest = () => ({ type: FETCH_DOCUMENT_REQUEST, loading: true });
const fetchJudgeSuccess = (instance) => ({ type: FETCH_DOCUMENT_SUCCESS, payload: instance, loading: false });
const fetchJudgeFailure = (error) => ({ type: FETCH_DOCUMENT_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchJudges = () => {
  return async (dispatch, getState) => {
    dispatch(fetchJudgesRequest());
    const { token } = getState().auth;
    try {
      const judges = await fetchJudgesFromAPI(token);
      dispatch(fetchJudgesSuccess(judges));
    } catch (error) {
      dispatch(fetchJudgesFailure(error));
    }
  };
};

const fetchJudge = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchJudgeRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/judges/${id}`, null, token);
      dispatch(fetchJudgeSuccess(instance));
    } catch (error) {
      dispatch(fetchJudgeFailure(error));
    }
  };
};

module.exports = {
  fetchJudge,
  fetchJudges,
  FETCH_DOCUMENT_REQUEST,
  FETCH_DOCUMENT_SUCCESS,
  FETCH_DOCUMENT_FAILURE,
  FETCH_DOCUMENTS_REQUEST,
  FETCH_DOCUMENTS_SUCCESS,
  FETCH_DOCUMENTS_FAILURE
};
