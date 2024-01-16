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

// Action creators
const fetchInvitationsRequest = () => ({ type: FETCH_INVITATIONS_REQUEST, loading: true });
const fetchInvitationsSuccess = (invitations) => ({ type: FETCH_INVITATIONS_SUCCESS, payload: invitations, loading: false });
const fetchInvitationsFailure = (error) => ({ type: FETCH_INVITATIONS_FAILURE, payload: error, loading: false });
const fetchInvitationRequest = () => ({ type: FETCH_INVITATION_REQUEST, loading: true });
const fetchInvitationSuccess = (instance) => ({ type: FETCH_INVITATION_SUCCESS, payload: instance, loading: false });
const fetchInvitationFailure = (error) => ({ type: FETCH_INVITATION_FAILURE, payload: error, loading: false });
const sendInvitationRequest = () => ({ type: SEND_INVITATION_REQUEST, loading: true });
const sendInvitationSuccess = (response) => ({ type: SEND_INVITATION_SUCCESS, payload: response});
const sendInvitationFailure = (error) => ({ type: SEND_INVITATION_FAILURE, payload: error});

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
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/invitations/${id}`, null, token);
      dispatch(fetchInvitationSuccess(instance));
    } catch (error) {
      dispatch(fetchInvitationFailure(error));
    }
  };
};

const sendInvitation = (email) => {
  return async (dispatch, getState) => {
    // console.log("vino al actions, con este mail",email);
    //   // const { token } = getState().auth;
    //   console.log("esta en el return, con este mail y token",email,token);
    dispatch(sendInvitationRequest());
    const { token } = getState().auth.token;
    try{
    const response = await fetch('/invitations', {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    console.log("la respuesta", response);
    dispatch(sendInvitationSuccess(response));
  }catch (error){
    dispatch(sendInvitationFailure(error));
  }

  }
}

module.exports = {
  fetchInvitation,
  fetchInvitations,
  sendInvitation,
  FETCH_INVITATION_REQUEST,
  FETCH_INVITATION_SUCCESS,
  FETCH_INVITATION_FAILURE,
  FETCH_INVITATIONS_REQUEST,
  FETCH_INVITATIONS_SUCCESS,
  FETCH_INVITATIONS_FAILURE,
  SEND_INVITATION_REQUEST,
  SEND_INVITATION_SUCCESS,
  SEND_INVITATION_FAILURE
};
