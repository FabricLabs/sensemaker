'use strict';

const createTimeoutPromise = require('../functions/createTimeoutPromise');


// Action types

const SEND_FEEDBACK_REQUEST = 'SEND_FEEDBACK_REQUEST';
const SEND_FEEDBACK_SUCCESS = 'SEND_FEEDBACK_SUCCESS';
const SEND_FEEDBACK_FAILURE = 'SEND_FEEDBACK_FAILURE';

// Action creators
const sendFeedbackRequest = () => ({ type: SEND_FEEDBACK_REQUEST });
const sendFeedbackSuccess = () => ({ type: SEND_FEEDBACK_SUCCESS });
const sendFeedbackFailure = (error) => ({ type: SEND_FEEDBACK_FAILURE, payload: error });


// Thunk action creator
const sendFeedback = (comment) => {
  return async (dispatch, getState) => {
    dispatch(sendFeedbackRequest());
    const { token } = getState().auth;
    try {
      const timeoutPromise = createTimeoutPromise(15000, 'Feedback could not be sent due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.')

      const fetchPromise = fetch('/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      dispatch(sendFeedbackSuccess());
    } catch (error) {
      dispatch(sendFeedbackFailure(error.message));
    }
  };
};

module.exports = {
  sendFeedback,
  SEND_FEEDBACK_REQUEST,
  SEND_FEEDBACK_SUCCESS,
  SEND_FEEDBACK_FAILURE,
};
