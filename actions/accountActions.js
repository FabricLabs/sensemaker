'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchAccountsFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/accounts', null, token);
}

async function fetchUsersFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/users', null, token);
}

// Action types
const FETCH_ACCOUNTS_REQUEST = 'FETCH_ACCOUNTS_REQUEST';
const FETCH_ACCOUNTS_SUCCESS = 'FETCH_ACCOUNTS_SUCCESS';
const FETCH_ACCOUNTS_FAILURE = 'FETCH_ACCOUNTS_FAILURE';

const FETCH_ACCOUNT_REQUEST = 'FETCH_ACCOUNT_REQUEST';
const FETCH_ACCOUNT_SUCCESS = 'FETCH_ACCOUNT_SUCCESS';
const FETCH_ACCOUNT_FAILURE = 'FETCH_ACCOUNT_FAILURE';

const PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST';
const PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS';
const PASSWORD_RESET_FAILURE = 'PASSWORD_RESET_FAILURE';

// Action creators
const fetchUsersRequest = () => ({ type: FETCH_ACCOUNTS_REQUEST, loading: true });
const fetchUsersSuccess = (users) => ({ type: FETCH_ACCOUNTS_SUCCESS, payload: users, loading: false });
const fetchUsersFailure = (error) => ({ type: FETCH_ACCOUNTS_FAILURE, payload: error, loading: false });

const fetchUserRequest = () => ({ type: FETCH_ACCOUNT_REQUEST, loading: true });
const fetchUserSuccess = (instance) => ({ type: FETCH_ACCOUNT_SUCCESS, payload: instance, loading: false });
const fetchUserFailure = (error) => ({ type: FETCH_ACCOUNT_FAILURE, payload: error, loading: false });

const askPasswordResetRequest = (email) => ({ type: PASSWORD_RESET_REQUEST, payload: email });
const askPasswordResetSuccess = () => ({ type: PASSWORD_RESET_SUCCESS });
const askPasswordResetFailure = (error) => ({ type: PASSWORD_RESET_FAILURE, payload: error });

// Thunk action creator
const fetchUsers = () => {
  return async (dispatch, getState) => {
    dispatch(fetchUsersRequest());
    const { token } = getState().auth;
    try {
      const users = await fetchUsersFromAPI(token);
      dispatch(fetchUsersSuccess(users));
    } catch (error) {
      dispatch(fetchUsersFailure(error));
    }
  };
};

const fetchUser = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchUserRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/users/${id}`, null, token);
      dispatch(fetchUserSuccess(instance));
    } catch (error) {
      dispatch(fetchUserFailure(error));
    }
  };
};

const askPasswordReset = (email) => {
  return async (dispatch, getState) => {
    dispatch(askPasswordResetRequest(email));
    const { token } = getState().auth;
    try {
      // call for the fetch that generates the token for password reset
      const fetchPromise = fetch('/passwordReset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Email could not be sent. Please check your internet connection."));
        }, 60000);
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      //email with reset token sent
      dispatch(askPasswordResetSuccess());
    } catch (error) {
      dispatch(askPasswordResetFailure(error));
    }
  };
}

module.exports = {
  fetchUser,
  fetchUsers,
  askPasswordReset,
  FETCH_ACCOUNT_REQUEST,
  FETCH_ACCOUNT_SUCCESS,
  FETCH_ACCOUNT_FAILURE,
  FETCH_ACCOUNTS_REQUEST,
  FETCH_ACCOUNTS_SUCCESS,
  FETCH_ACCOUNTS_FAILURE,
  PASSWORD_RESET_REQUEST,
  PASSWORD_RESET_SUCCESS,
  PASSWORD_RESET_FAILURE
};
