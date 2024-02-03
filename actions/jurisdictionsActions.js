'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchJurisdictionsFromAPI(token) {
  return fetchFromAPI('/jurisdictions', null, token);
}

// Action types
const FETCH_JURISDICTIONS_REQUEST = 'FETCH_JURISDICTIONS_REQUEST';
const FETCH_JURISDICTIONS_SUCCESS = 'FETCH_JURISDICTIONS_SUCCESS';
const FETCH_JURISDICTIONS_FAILURE = 'FETCH_JURISDICTIONS_FAILURE';
const FETCH_JURISDICTION_REQUEST = 'FETCH_JURISDICTION_REQUEST';
const FETCH_JURISDICTION_SUCCESS = 'FETCH_JURISDICTION_SUCCESS';
const FETCH_JURISDICTION_FAILURE = 'FETCH_JURISDICTION_FAILURE';

// Action creators
const fetchJurisdictionsRequest = () => ({ type: FETCH_JURISDICTIONS_REQUEST });
const fetchJurisdictionsSuccess = (jurisdictions) => ({ type: FETCH_JURISDICTIONS_SUCCESS, payload: jurisdictions });
const fetchJurisdictionsFailure = (error) => ({ type: FETCH_JURISDICTIONS_FAILURE, payload: error });
const fetchJurisdictionRequest = () => ({ type: FETCH_JURISDICTION_REQUEST });
const fetchJurisdictionSuccess = (instance) => ({ type: FETCH_JURISDICTION_SUCCESS, payload: instance });
const fetchJurisdictionFailure = (error) => ({ type: FETCH_JURISDICTION_FAILURE, payload: error });

// Thunk action creator
const fetchJurisdictions = () => {
  return async (dispatch, getState) => {
    dispatch(fetchJurisdictionsRequest());
    const { token } = getState().auth;
    try {
      const courts = await fetchJurisdictionsFromAPI(token);
      dispatch(fetchJurisdictionsSuccess(courts));
    } catch (error) {
      dispatch(fetchJurisdictionsFailure(error));
    }
  };
};

const fetchJurisdiction = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchJurisdictionRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/jurisdictions/${id}`, null, token);
      dispatch(fetchJurisdictionSuccess(instance));
    } catch (error) {
      dispatch(fetchJurisdictionFailure(error));
    }
  };
};

module.exports = {
  fetchJurisdiction,
  fetchJurisdictions,
  FETCH_JURISDICTION_REQUEST,
  FETCH_JURISDICTION_SUCCESS,
  FETCH_JURISDICTION_FAILURE,
  FETCH_JURISDICTIONS_REQUEST,
  FETCH_JURISDICTIONS_SUCCESS,
  FETCH_JURISDICTIONS_FAILURE
};
