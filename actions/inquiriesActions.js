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


const CREATE_INQUIRY_REQUEST = 'CREATE_INQUIRY_REQUEST';
const CREATE_INQUIRY_SUCCESS = 'CREATE_INQUIRY_SUCCESS';
const CREATE_INQUIRY_FAILURE = 'CREATE_INQUIRY_FAILURE';

// Action creators
const fetchInquiriesRequest = () => ({ type: FETCH_INQUIRIES_REQUEST, loading: true });
const fetchInquiriesSuccess = (inquiries) => ({ type: FETCH_INQUIRIES_SUCCESS, payload: inquiries, loading: false });
const fetchInquiriesFailure = (error) => ({ type: FETCH_INQUIRIES_FAILURE, payload: error, loading: false });

const fetchInquiryRequest = () => ({ type: FETCH_INQUIRY_REQUEST, loading: true });
const fetchInquirySuccess = (instance) => ({ type: FETCH_INQUIRY_SUCCESS, payload: instance, loading: false });
const fetchInquiryFailure = (error) => ({ type: FETCH_INQUIRY_FAILURE, payload: error, loading: false });

const deleteInquiryRequest = () => ({ type: DELETE_INQUIRY_REQUEST });
const deleteInquirySuccess = (data) => ({ type: DELETE_INQUIRY_SUCCESS, payload: data });
const deleteInquiryFailure = (error) => ({ type: DELETE_INQUIRY_FAILURE, payload: error })

const createInquiryRequest = () => ({ type: CREATE_INQUIRY_REQUEST });
const createInquirySuccess = (data) => ({ type: CREATE_INQUIRY_SUCCESS, payload: data });
const createInquiryFailure = (error) => ({ type: CREATE_INQUIRY_FAILURE, payload: error })


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

const createInquiry = (email) => {
  return async dispatch => {
    dispatch(createInquiryRequest());
    try {
      const fetchPromise = fetch('/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Error joining the waitlist. Please check your internet connection.'));
        }, 15000);
      });

      const results = await Promise.all([
        new Promise((resolve, reject) => {
          setTimeout(resolve, 1500);
        }),
        //Whichever promise completes first will determine the outcome.
        await Promise.race([fetchPromise, timeoutPromise])
      ]);

      const response = results[1];

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      dispatch(createInquirySuccess(response));
    } catch (error) {
      dispatch(createInquiryFailure(error.message));
     }
  }
}

const deleteInquiry = (ID) => {
  return async dispatch => {
    dispatch(deleteInquiryRequest());
    try {
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
    } catch (error) {
      console.log("Error updating invitation status:", error.message);
      dispatch(deleteInquiryFailure(error.message));
    }
  }
}

module.exports = {
  fetchInquiry,
  fetchInquiries,
  deleteInquiry,
  createInquiry,
  FETCH_INQUIRY_REQUEST,
  FETCH_INQUIRY_SUCCESS,
  FETCH_INQUIRY_FAILURE,
  FETCH_INQUIRIES_REQUEST,
  FETCH_INQUIRIES_SUCCESS,
  FETCH_INQUIRIES_FAILURE,
  CREATE_INQUIRY_REQUEST,
  CREATE_INQUIRY_SUCCESS,
  CREATE_INQUIRY_FAILURE,
  DELETE_INQUIRY_REQUEST,
  DELETE_INQUIRY_SUCCESS,
  DELETE_INQUIRY_FAILURE,
};
