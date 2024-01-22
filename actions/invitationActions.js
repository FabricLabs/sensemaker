'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchInvitationsFromAPI(token) {
  return fetchFromAPI('/invitations', null, token);
}

// Action types
const FETCH_INVITATIONS_REQUEST = 'FETCH_INVITATIONS_REQUEST';
const FETCH_INVITATIONS_SUCCESS = 'FETCH_INVITATIONS_SUCCESS';
const FETCH_INVITATIONS_FAILURE = 'FETCH_INVITATIONS_FAILURE';

const FETCH_INVITATION_REQUEST = 'FETCH_INVITATION_REQUEST';
const FETCH_INVITATION_SUCCESS = 'FETCH_INVITATION_SUCCESS';
const FETCH_INVITATION_FAILURE = 'FETCH_INVITATION_FAILURE';

const SEND_INVITATION_REQUEST = 'SEND_INVITATION_REQUEST';
const SEND_INVITATION_SUCCESS = 'SEND_INVITATION_SUCCESS';
const SEND_INVITATION_FAILURE = 'SEND_INVITATION_FAILURE';

const ACCEPT_INVITATION_REQUEST = 'ACCEPT_INVITATION_REQUEST';
const ACCEPT_INVITATION_SUCCESS = 'ACCEPT_INVITATION_SUCCESS';
const ACCEPT_INVITATION_FAILURE = 'ACCEPT_INVITATION_FAILURE';

const DECLINE_INVITATION_REQUEST = 'DECLINE_INVITATION_REQUEST';
const DECLINE_INVITATION_SUCCESS = 'DECLINE_INVITATION_SUCCESS';
const DECLINE_INVITATION_FAILURE = 'DECLINE_INVITATION_FAILURE';

const CHECK_INVITATION_TOKEN_REQUEST = 'CHECK_INVITATION_TOKEN_REQUEST';
const CHECK_INVITATION_TOKEN_SUCCESS = 'CHECK_INVITATION_TOKEN_SUCCESS';
const CHECK_INVITATION_TOKEN_FAILURE = 'CHECK_INVITATION_TOKEN_FAILURE';

// Action creators
const fetchInvitationsRequest = () => ({ type: FETCH_INVITATIONS_REQUEST, loading: true });
const fetchInvitationsSuccess = (invitations) => ({ type: FETCH_INVITATIONS_SUCCESS, payload: invitations, loading: false });
const fetchInvitationsFailure = (error) => ({ type: FETCH_INVITATIONS_FAILURE, payload: error, loading: false });

const fetchInvitationRequest = () => ({ type: FETCH_INVITATION_REQUEST, loading: true });
const fetchInvitationSuccess = (instance) => ({ type: FETCH_INVITATION_SUCCESS, payload: instance, loading: false });
const fetchInvitationFailure = (error) => ({ type: FETCH_INVITATION_FAILURE, payload: error, loading: false });

const sendInvitationRequest = () => ({ type: SEND_INVITATION_REQUEST, loading: true });
const sendInvitationSuccess = (response) => ({ type: SEND_INVITATION_SUCCESS, payload: response });
const sendInvitationFailure = (error) => ({ type: SEND_INVITATION_FAILURE, payload: error });

const checkInvitationTokenRequest = () => ({ type: CHECK_INVITATION_TOKEN_REQUEST });
const checkInvitationTokenSuccess = (response) => ({ type: CHECK_INVITATION_TOKEN_SUCCESS, payload: response });
const checkInvitationTokenFailure = (error) => ({ type: CHECK_INVITATION_TOKEN_FAILURE, payload: error });

const acceptInvitationRequest = () => ({ type: ACCEPT_INVITATION_REQUEST});
const acceptInvitationSuccess = (data) => ({ type: ACCEPT_INVITATION_SUCCESS, payload: response });
const acceptInvitationFailure = (error) => ({ type: ACCEPT_INVITATION_FAILURE, payload: error });

const declineInvitationRequest = () => ({ type: DECLINE_INVITATION_REQUESTINVITATION_REQUEST});
const declineInvitationSuccess = (data) => ({ type: DECLINE_INVITATION_REQUESTINVITATION_SUCCESS, payload: response });
const declineInvitationFailure = (error) => ({ type: DECLINE_INVITATION_REQUESTINVITATION_FAILURE, payload: error })

// Thunk action creator
const fetchInvitations = () => {
  return async (dispatch, getState) => {
    dispatch(fetchInvitationsRequest());
    const { token } = getState().auth;
    try {
      const invitations = await fetchInvitationsFromAPI(token);
      dispatch(fetchInvitationsSuccess(invitations));
    } catch (error) {
      dispatch(fetchInvitationsFailure(error));
    }
  };
};

const fetchInvitation = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchInvitationRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/invitations/${id}`, null, token);
      dispatch(fetchInvitationSuccess(instance));
    } catch (error) {
      dispatch(fetchInvitationFailure(error));
    }
  };
};

//used to send the first invitations, this will actually create the new invitation for the user, if it didn't exist
const sendInvitation = (email) => {
  return async (dispatch, getState) => {
    dispatch(sendInvitationRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch('/invitations', {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      dispatch(sendInvitationSuccess(response));
    } catch (error) {
      dispatch(sendInvitationFailure(error));
    }

  }
}

//re send the invitation that was created before
const reSendInvitation = (id) => {
  return async (dispatch, getState) => {
    dispatch(sendInvitationRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch(`/invitations/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      dispatch(sendInvitationSuccess(response));
    } catch (error) {
      dispatch(sendInvitationFailure(error));
    }

  }
}

const checkInvitationToken = (invitationToken) => {
  return async (dispatch) => {
    dispatch(checkInvitationTokenRequest());
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Error: Please check your internet connection"));
        }, 15000);
      });

      const fetchPromise = fetch(`/checkInvitationToken/${invitationToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      const data = await response.json();

      dispatch(checkInvitationTokenSuccess(data));
    } catch (error) {
      dispatch(checkInvitationTokenFailure(error.message));
    }
  }
}

const acceptInvitation = (invitationToken)=>{
  return async dispatch =>{
    dispatch(acceptInvitationRequest());
    try{
      const response = await fetch(`/invitations/accept/${invitationToken}`, {
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
      dispatch(acceptInvitationSuccess(data));
    }catch(error){
      console.log("Error updating invitation status:", error.message);
      dispatch(acceptInvitationFailure(error.message));
    }

  }
}

const declineInvitation = (invitationToken)=>{
  return async dispatch =>{
    dispatch(declineInvitationRequest());
    try{
      const response = await fetch(`/invitations/decline/${invitationToken}`, {
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
      dispatch(declineInvitationSuccess(data));
    }catch(error){
      console.log("Error updating invitation status:", error.message);
      dispatch(declineInvitationFailure(error.message));
    }
  }
}


module.exports = {
  fetchInvitation,
  fetchInvitations,
  sendInvitation,
  reSendInvitation,
  checkInvitationToken,
  acceptInvitation,
  declineInvitation,
  FETCH_INVITATION_REQUEST,
  FETCH_INVITATION_SUCCESS,
  FETCH_INVITATION_FAILURE,
  FETCH_INVITATIONS_REQUEST,
  FETCH_INVITATIONS_SUCCESS,
  FETCH_INVITATIONS_FAILURE,
  SEND_INVITATION_REQUEST,
  SEND_INVITATION_SUCCESS,
  SEND_INVITATION_FAILURE,
  CHECK_INVITATION_TOKEN_REQUEST,
  CHECK_INVITATION_TOKEN_SUCCESS,
  CHECK_INVITATION_TOKEN_FAILURE,
  ACCEPT_INVITATION_REQUEST,
  ACCEPT_INVITATION_SUCCESS,
  ACCEPT_INVITATION_FAILURE,
  DECLINE_INVITATION_REQUEST,
  DECLINE_INVITATION_SUCCESS,
  DECLINE_INVITATION_FAILURE,  
};
