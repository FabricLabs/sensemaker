'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
const createTimeoutPromise = require('../functions/createTimeoutPromise');

// API Functions
async function fetchStatsFromAPI (token) {
  const response = await fetch('/statistics/admin', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  return await response.json();
}

async function fetchSyncStatsFromAPI (token) {
  const response = await fetch('/statistics/sync', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  return await response.json();
}

async function createInvitationThroughAPI (invitation, token) {
  const response = await fetch('/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(invitation)
  });

  return await response.json();
}

// Action types
const FETCH_ADMIN_STATS_REQUEST = 'FETCH_ADMIN_STATS_REQUEST';
const FETCH_ADMIN_STATS_SUCCESS = 'FETCH_ADMIN_STATS_SUCCESS';
const FETCH_ADMIN_STATS_FAILURE = 'FETCH_ADMIN_STATS_FAILURE';

const FETCH_SYNC_STATS_REQUEST = 'FETCH_SYNC_STATS_REQUEST';
const FETCH_SYNC_STATS_SUCCESS = 'FETCH_SYNC_STATS_SUCCESS';
const FETCH_SYNC_STATS_FAILURE = 'FETCH_SYNC_STATS_FAILURE';

const FETCH_ALL_CONVERSATIONS_SUCCESS = 'FETCH_ALL_CONVERSATIONS_SUCCESS';
const FETCH_ALL_CONVERSATIONS_FAILURE = 'FETCH_ALL_CONVERSATIONS_FAILURE';

const CREATE_INVITATION_REQUEST = 'CREATE_INVITATION_REQUEST';
const CREATE_INVITATION_SUCCESS = 'CREATE_INVITATION_SUCCESS';
const CREATE_INVITATION_FAILURE = 'CREATE_INVITATION_FAILURE';

const EDIT_USERNAME_REQUEST = 'EDIT_USERNAME_REQUEST';
const EDIT_USERNAME_SUCCESS = 'EDIT_USERNAME_SUCCESS';
const EDIT_USERNAME_FAILURE = 'EDIT_USERNAME_FAILURE';

const EDIT_EMAIL_REQUEST = 'EDIT_EMAIL_REQUEST';
const EDIT_EMAIL_SUCCESS = 'EDIT_EMAIL_SUCCESS';
const EDIT_EMAIL_FAILURE = 'EDIT_EMAIL_FAILURE';

// Action creators
const fetchAdminStatsRequest = () => ({ type: FETCH_ADMIN_STATS_REQUEST });
const fetchAdminStatsSuccess = (stats) => ({ type: FETCH_ADMIN_STATS_SUCCESS, payload: stats });
const fetchAdminStatsFailure = (error) => ({ type: FETCH_SYNC_STATS_FAILURE, payload: error });

const fetchSyncStatsFailure = (error) => ({ type: FETCH_ADMIN_STATS_FAILURE, payload: error });
const fetchSyncStatsRequest = () => ({ type: FETCH_SYNC_STATS_REQUEST });
const fetchSyncStatsSuccess = (stats) => ({ type: FETCH_SYNC_STATS_SUCCESS, payload: stats });

const fetchAllConversationsSuccess = (conversations) => ({ type: FETCH_ALL_CONVERSATIONS_SUCCESS, payload: conversations });
const fetchAllConversationsFailure = (error) => ({ type: FETCH_ALL_CONVERSATIONS_FAILURE, payload: error });

const createInvitationRequest = () => ({ type: CREATE_INVITATION_REQUEST });
const createInvitationSuccess = (instance) => ({ type: CREATE_INVITATION_SUCCESS, payload: instance });
const createInvitationFailure = (error) => ({ type: CREATE_INVITATION_FAILURE, payload: error });

const editUsernameRequest = () => ({ type: EDIT_USERNAME_REQUEST, loading: true });
const editUsernameSuccess = () => ({ type: EDIT_USERNAME_SUCCESS, loading: false });
const editUsernameFailure = (error) => ({ type: EDIT_USERNAME_FAILURE, payload: error, loading: false });

const editEmailRequest = () => ({ type: EDIT_EMAIL_REQUEST, loading: true });
const editEmailSuccess = () => ({ type: EDIT_EMAIL_SUCCESS, loading: false });
const editEmailFailure = (error) => ({ type: EDIT_EMAIL_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchAdminStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAdminStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchAdminStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchAdminStatsFailure(error));
    }
  };
};

const fetchSyncStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchSyncStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchSyncStatsFromAPI(token);
      dispatch(fetchSyncStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchSyncStatsFailure(error));
    }
  };
};

const fetchAllConversationsFromAPI = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAdminStatsRequest());
    const { token } = getState().auth;

    try {
      const conversations = await fetchFromAPI('/conversations', {
        query: {
          include: '*'
        }
      }, token);

      dispatch(fetchAllConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchAllConversationsFailure(error));
    }
  };
}

const createInvitation = (invitation) => {
  return async (dispatch, getState) => {
    dispatch(createInvitationRequest());
    const { token } = getState().auth;

    try {
      const instance = await createInvitationThroughAPI(invitation, token);
      dispatch(createInvitationSuccess(instance));
    } catch (error) {
      dispatch(createInvitationFailure(error));
    }
  };
}

const editUsername = (id, newUsername) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    dispatch(editUsernameRequest());
    try {
      const fetchPromise = fetch('/users/username', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, newUsername }),
      });

      const timeoutPromise = createTimeoutPromise(15000, 'Fetch timed out');
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      dispatch(editUsernameSuccess());
    } catch (error) {
      dispatch(editUsernameFailure(error));
    }
  }
}

const editEmail = (id, newEmail) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    dispatch(editEmailRequest());
    try {
      const fetchPromise = fetch('/users/email', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, newEmail }),
      });

      const timeoutPromise = createTimeoutPromise(15000, 'Fetch timed out');
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      dispatch(editEmailSuccess());
    } catch (error) {
      dispatch(editEmailFailure(error));
    }
  }
}

module.exports = {
  fetchAdminStats,
  fetchAllConversationsFromAPI,
  fetchSyncStats,
  createInvitation,
  editUsername,
  editEmail,
  FETCH_ADMIN_STATS_REQUEST,
  FETCH_ADMIN_STATS_SUCCESS,
  FETCH_ADMIN_STATS_FAILURE,
  EDIT_USERNAME_REQUEST,
  EDIT_USERNAME_SUCCESS,
  EDIT_USERNAME_FAILURE,
  EDIT_EMAIL_REQUEST,
  EDIT_EMAIL_SUCCESS,
  EDIT_EMAIL_FAILURE,
};
