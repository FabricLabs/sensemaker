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

const DELETE_INQUIRY_REQUEST = 'DELETE_INQUIRY_REQUEST';
const DELETE_INQUIRY_SUCCESS = 'DELETE_INQUIRY_SUCCESS';
const DELETE_INQUIRY_FAILURE = 'DELETE_INQUIRY_FAILURE';

// Action creators
const fetchInquiriesRequest = () => ({ type: FETCH_INQUIRIES_REQUEST, loading: true });
const fetchInquiriesSuccess = (inquiries) => ({ type: FETCH_INQUIRIES_SUCCESS, payload: inquiries, loading: false });
const fetchInquiriesFailure = (error) => ({ type: FETCH_INQUIRIES_FAILURE, payload: error, loading: false });

const fetchInquiryRequest = () => ({ type: FETCH_INQUIRY_REQUEST, loading: true });
const fetchInquirySuccess = (instance) => ({ type: FETCH_INQUIRY_SUCCESS, payload: instance, loading: false });
const fetchInquiryFailure = (error) => ({ type: FETCH_INQUIRY_FAILURE, payload: error, loading: false });

const deleteInquiryRequest = () => ({ type: DELETE_INQUIRY_REQUEST});
const deleteInquirySuccess = (data) => ({ type: DELETE_INQUIRY_SUCCESS, payload: data });
const deleteInquiryFailure = (error) => ({ type: DELETE_INQUIRY_FAILURE, payload: error })


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

const deleteInquiry = (ID)=>{
  return async dispatch =>{
    dispatch(deleteInquiryRequest());
    try{
      const response = await fetch(`/inquiries/delete/${ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      const data = await response.json();
      dispatch(deleteInquirySuccess(data));
    }catch(error){
      console.log("Error updating invitation status:", error.message);
      dispatch(deleteInquiryFailure(error.message));
    }
  }
}

module.exports = {
  fetchInquiry,
  fetchInquiries,
  deleteInquiry,
  FETCH_INQUIRY_REQUEST,
  FETCH_INQUIRY_SUCCESS,
  FETCH_INQUIRY_FAILURE,
  FETCH_INQUIRIES_REQUEST,
  FETCH_INQUIRIES_SUCCESS,
  FETCH_INQUIRIES_FAILURE,
  DELETE_INQUIRY_REQUEST,
  DELETE_INQUIRY_SUCCESS,
  DELETE_INQUIRY_FAILURE,
};
