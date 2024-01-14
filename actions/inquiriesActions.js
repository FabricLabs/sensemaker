'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchInquiriesFromAPI(token) {
  return fetchFromAPI('/inquiries', null, token);
}

// Action types
const FETCH_INQUIRIES_REQUEST = 'FETCH_INQUIRIES_REQUEST';
const FETCH_INQUIRIES_SUCCESS = 'FETCH_INQUIRIES_SUCCESS';
const FETCH_INQUIRIES_FAILURE = 'FETCH_INQUIRIES_FAILURE';
const FETCH_INQUIRY_REQUEST = 'FETCH_INQUIRY_REQUEST';
const FETCH_INQUIRY_SUCCESS = 'FETCH_INQUIRY_SUCCESS';
const FETCH_INQUIRY_FAILURE = 'FETCH_INQUIRY_FAILURE';

// Action creators
const fetchInquiriesRequest = () => ({ type: FETCH_INQUIRIES_REQUEST, loading: true });
const fetchInquiriesSuccess = (inquiries) => ({ type: FETCH_INQUIRIES_SUCCESS, payload: inquiries, loading: false });
const fetchInquiriesFailure = (error) => ({ type: FETCH_INQUIRIES_FAILURE, payload: error, loading: false });
const fetchInquiryRequest = () => ({ type: FETCH_INQUIRY_REQUEST, loading: true });
const fetchInquirySuccess = (instance) => ({ type: FETCH_INQUIRY_SUCCESS, payload: instance, loading: false });
const fetchInquiryFailure = (error) => ({ type: FETCH_INQUIRY_FAILURE, payload: error, loading: false });

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

const fetchInquiry = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchInquiryRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/inquiries/${id}`, null, token);
      dispatch(fetchInquirySuccess(instance));
    } catch (error) {
      dispatch(fetchInquiryFailure(error));
    }
  };
};

module.exports = {
  fetchInquiry,
  fetchInquiries,
  FETCH_INQUIRY_REQUEST,
  FETCH_INQUIRY_SUCCESS,
  FETCH_INQUIRY_FAILURE,
  FETCH_INQUIRIES_REQUEST,
  FETCH_INQUIRIES_SUCCESS,
  FETCH_INQUIRIES_FAILURE
};
