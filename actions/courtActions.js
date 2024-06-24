'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchCourtsFromAPI (token) {
  return fetchFromAPI('/courts', null, token);
}
async function fetchJurisdictionCourtsFromAPI (jurisdiction_id,token) {
  return fetchFromAPI(`/courts/jurisdiction/${jurisdiction_id}`, null, token);
}

// Action types
const FETCH_COURTS_REQUEST = 'FETCH_COURTS_REQUEST';
const FETCH_COURTS_SUCCESS = 'FETCH_COURTS_SUCCESS';
const FETCH_COURTS_FAILURE = 'FETCH_COURTS_FAILURE';
const FETCH_COURT_REQUEST = 'FETCH_COURT_REQUEST';
const FETCH_COURT_SUCCESS = 'FETCH_COURT_SUCCESS';
const FETCH_COURT_FAILURE = 'FETCH_COURT_FAILURE';
const FETCH_COURT_BY_ID_REQUEST = 'FETCH_COURT_BY_ID_REQUEST';
const FETCH_COURT_BY_ID_SUCCESS = 'FETCH_COURT_BY_ID_SUCCESS';
const FETCH_COURT_BY_ID_FAILURE = 'FETCH_COURT_BY_ID_FAILURE';
const SEARCH_COURT_REQUEST = 'SEARCH_COURT_REQUEST';
const SEARCH_COURT_SUCCESS = 'SEARCH_COURT_SUCCESS';
const SEARCH_COURT_FAILURE = 'SEARCH_COURT_FAILURE';

// Action creators
const fetchCourtsRequest = () => ({ type: FETCH_COURTS_REQUEST, loading: true });
const fetchCourtsSuccess = (courts) => ({ type: FETCH_COURTS_SUCCESS, payload: courts, loading: false });
const fetchCourtsFailure = (error) => ({ type: FETCH_COURTS_FAILURE, payload: error, loading: false  });
const fetchCourtRequest = () => ({ type: FETCH_COURT_REQUEST, loading: true });
const fetchCourtSuccess = (instance) => ({ type: FETCH_COURT_SUCCESS, payload: instance, loading: false });
const fetchCourtFailure = (error) => ({ type: FETCH_COURT_FAILURE, payload: error, loading: false });
const fetchCourtByIdRequest = () => ({ type: FETCH_COURT_BY_ID_REQUEST, loading: true });
const fetchCourtByIdSuccess = (instance) => ({ type: FETCH_COURT_BY_ID_SUCCESS, payload: instance, loading: false });
const fetchCourtByIdFailure = (error) => ({ type: FETCH_COURT_BY_ID_FAILURE, payload: error, loading: false });
const searchCourtRequest = () => ({ type: SEARCH_COURT_REQUEST });
const searchCourtSuccess = (results) => ({ type: SEARCH_COURT_SUCCESS, payload: results });
const searchCourtFailure = (error) => ({ type: SEARCH_COURT_FAILURE, payload: error });

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


const fetchCourtsByJurisdiction = (jurisdiction_id) => {
  return async (dispatch, getState) => {
    dispatch(fetchCourtsRequest());
    const { token } = getState().auth;
    try {
      const courts = await fetchJurisdictionCourtsFromAPI(jurisdiction_id,token);
      dispatch(fetchCourtsSuccess(courts));
    } catch (error) {
      dispatch(fetchCourtsFailure(error));
    }
  };
};

const fetchCourt = (slug) => {
  return async (dispatch, getState) => {
    dispatch(fetchCourtRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/courts/${slug}`, null, token);
      dispatch(fetchCourtSuccess(instance));
    } catch (error) {
      dispatch(fetchCourtFailure(error));
    }
  };
};

const fetchCourtById = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchCourtByIdRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/courts/id/${id}`, null, token);
      dispatch(fetchCourtByIdSuccess(instance));
    } catch (error) {
      dispatch(fetchCourtByIdFailure(error));
    }
  };
};

const searchCourt = (query) => {
  return async (dispatch, getState) => {
    dispatch(searchCourtRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch('/courts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'SEARCH',
        body: JSON.stringify({ query })
      });

      const obj = await response.json();
      console.log('fetch result: ', obj);

      dispatch(searchCourtSuccess(obj.content));
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(searchCourtFailure(error.message));
    }
  }
}

module.exports = {
  fetchCourt,
  fetchCourts,
  fetchCourtsByJurisdiction,
  fetchCourtById,
  searchCourt,
  FETCH_COURT_REQUEST,
  FETCH_COURT_SUCCESS,
  FETCH_COURT_FAILURE,
  FETCH_COURT_BY_ID_REQUEST,
  FETCH_COURT_BY_ID_SUCCESS,
  FETCH_COURT_BY_ID_FAILURE,
  FETCH_COURTS_REQUEST,
  FETCH_COURTS_SUCCESS,
  FETCH_COURTS_FAILURE,
  SEARCH_COURT_REQUEST,
  SEARCH_COURT_SUCCESS,
  SEARCH_COURT_FAILURE,
};
