'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchJudgesFromAPI (token) {
  return fetchFromAPI('/judges', null, token);
}

// Action types
const FETCH_JUDGES_REQUEST = 'FETCH_JUDGES_REQUEST';
const FETCH_JUDGES_SUCCESS = 'FETCH_JUDGES_SUCCESS';
const FETCH_JUDGES_FAILURE = 'FETCH_JUDGES_FAILURE';
const FETCH_JUDGE_REQUEST = 'FETCH_JUDGE_REQUEST';
const FETCH_JUDGE_SUCCESS = 'FETCH_JUDGE_SUCCESS';
const FETCH_JUDGE_FAILURE = 'FETCH_JUDGE_FAILURE';

// Action creators
const fetchJudgesRequest = () => ({ type: FETCH_JUDGES_REQUEST, loading: true });
const fetchJudgesSuccess = (judges) => ({ type: FETCH_JUDGES_SUCCESS, payload: judges, loading: false });
const fetchJudgesFailure = (error) => ({ type: FETCH_JUDGES_FAILURE, payload: error, loading: false  });
const fetchJudgeRequest = () => ({ type: FETCH_JUDGE_REQUEST, loading: true });
const fetchJudgeSuccess = (instance) => ({ type: FETCH_JUDGE_SUCCESS, payload: instance, loading: false });
const fetchJudgeFailure = (error) => ({ type: FETCH_JUDGE_FAILURE, payload: error, loading: false });

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
  FETCH_JUDGE_REQUEST,
  FETCH_JUDGE_SUCCESS,
  FETCH_JUDGE_FAILURE,
  FETCH_JUDGES_REQUEST,
  FETCH_JUDGES_SUCCESS,
  FETCH_JUDGES_FAILURE
};
