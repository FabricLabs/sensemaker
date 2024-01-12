'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchInquiriesFromAPI(token) {
  return fetchFromAPI('/inquiries', null, token);
}

// Action types
const FETCH_INQUIRIES_REQUEST = 'FETCH_INQUIRIES_REQUEST';
const FETCH_INQUIRIES_SUCCESS = 'FETCH_INQUIRIES_SUCCESS';
const FETCH_INQUIRIES_FAILURE = 'FETCH_INQUIRIES_FAILURE';
const FETCH_INQUIRIE_REQUEST = 'FETCH_INQUIRIE_REQUEST';
const FETCH_INQUIRIE_SUCCESS = 'FETCH_INQUIRIE_SUCCESS';
const FETCH_INQUIRIE_FAILURE = 'FETCH_INQUIRIE_FAILURE';

// Action creators
const fetchInquiriesRequest = () => ({ type: FETCH_INQUIRIES_REQUEST, loading: true });
const fetchInquiriesSuccess = (inquiries) => ({ type: FETCH_INQUIRIES_SUCCESS, payload: inquiries, loading: false });
const fetchInquiriesFailure = (error) => ({ type: FETCH_INQUIRIES_FAILURE, payload: error, loading: false });
const fetchInquirieRequest = () => ({ type: FETCH_INQUIRIE_REQUEST, loading: true });
const fetchInquirieSuccess = (inquiries) => ({ type: FETCH_INQUIRIE_SUCCESS, payload: inquiries, loading: false });
const fetchInquirieFailure = (error) => ({ type: FETCH_INQUIRIE_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchInquiries = () => {
  return async (dispatch, getState) => {
    dispatch(fetchInquiriesRequest());
    const { token } = getState().auth;
    try {
      const inquiries = await fetchInquiriesFromAPI(token);
      dispatch(fetchInquiriesSuccess(inquiries));
    } catch (error) {
      dispatch(fetchInquiriesFailure(error));
    }
  };
};

const fetchInquirie = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchInquirieRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/inquiries/${id}`, null, token);
      dispatch(fetchInquirieSuccess(instance));
    } catch (error) {
      dispatch(fetchInquirieFailure(error));
    }
  };
};

module.exports = {
  fetchInquirie,
  fetchInquiries,
  FETCH_INQUIRIE_REQUEST,
  FETCH_INQUIRIE_SUCCESS,
  FETCH_INQUIRIE_FAILURE,
  FETCH_INQUIRIES_REQUEST,
  FETCH_INQUIRIES_SUCCESS,
  FETCH_INQUIRIES_FAILURE
};
