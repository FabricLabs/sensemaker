'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchStatutesFromAPI(token) {
  return fetchFromAPI('/statutes', null, token);
}

// Action types
const FETCH_STATUTES_REQUEST = 'FETCH_STATUTES_REQUEST';
const FETCH_STATUTES_SUCCESS = 'FETCH_STATUTES_SUCCESS';
const FETCH_STATUTES_FAILURE = 'FETCH_STATUTES_FAILURE';
const FETCH_STATUTE_REQUEST = 'FETCH_STATUTE_REQUEST';
const FETCH_STATUTE_SUCCESS = 'FETCH_STATUTE_SUCCESS';
const FETCH_STATUTE_FAILURE = 'FETCH_STATUTE_FAILURE';

// Action creators
const fetchStatutesRequest = () => ({ type: FETCH_STATUTES_REQUEST });
const fetchStatutesSuccess = (statutes) => ({ type: FETCH_STATUTES_SUCCESS, payload: statutes });
const fetchStatutesFailure = (error) => ({ type: FETCH_STATUTES_FAILURE, payload: error });
const fetchStatuteRequest = () => ({ type: FETCH_STATUTE_REQUEST });
const fetchStatuteSuccess = (instance) => ({ type: FETCH_STATUTE_SUCCESS, payload: instance });
const fetchStatuteFailure = (error) => ({ type: FETCH_STATUTE_FAILURE, payload: error });

// Thunk action creator
const fetchStatutes = () => {
  return async (dispatch, getState) => {
    dispatch(fetchStatutesRequest());
    const { token } = getState().auth;
    try {
      const courts = await fetchStatutesFromAPI(token);
      dispatch(fetchStatutesSuccess(courts));
    } catch (error) {
      dispatch(fetchStatutesFailure(error));
    }
  };
};

const fetchStatute = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchStatuteRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/statutes/${id}`, null, token);
      dispatch(fetchStatuteSuccess(instance));
    } catch (error) {
      dispatch(fetchStatuteFailure(error));
    }
  };
};

module.exports = {
  fetchStatute,
  fetchStatutes,
  FETCH_STATUTE_REQUEST,
  FETCH_STATUTE_SUCCESS,
  FETCH_STATUTE_FAILURE,
  FETCH_STATUTES_REQUEST,
  FETCH_STATUTES_SUCCESS,
  FETCH_STATUTES_FAILURE
};
