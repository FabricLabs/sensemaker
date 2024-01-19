'use strict';

// Constants
const {
  BROWSER_DATABASE_NAME,
  BROWSER_DATABASE_TOKEN_TABLE
} = require('../constants');

// Dependencies
const fetch = require('cross-fetch');

// Action Types
const LOGIN_REQUEST = 'LOGIN_REQUEST';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';
const REGISTER_REQUEST = 'REGISTER_REQUEST';
const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
const REGISTER_FAILURE = 'REGISTER_FAILURE';
const CHECK_USERNAME_AVAILABLE_REQUEST = 'CHECK_USERNAME_AVAILABLE_REQUEST';
const CHECK_USERNAME_AVAILABLE_SUCCESS = 'CHECK_USERNAME_AVAILABLE_SUCCESS';
const CHECK_USERNAME_AVAILABLE_FAILURE = 'CHECK_USERNAME_AVAILABLE_FAILURE';
const CHECK_EMAIL_AVAILABLE_REQUEST = 'CHECK_EMAIL_AVAILABLE_REQUEST';
const CHECK_EMAIL_AVAILABLE_SUCCESS = 'CHECK_EMAIL_AVAILABLE_SUCCESS';
const CHECK_EMAIL_AVAILABLE_FAILURE = 'CHECK_EMAIL_AVAILABLE_FAILURE';

// Sync Action Creators
const loginRequest = () => ({ type: LOGIN_REQUEST });
const loginSuccess = (session) => ({ type: LOGIN_SUCCESS, payload: session });
const loginFailure = error => ({ type: LOGIN_FAILURE, payload: error, error: error });
const registerRequest = () => ({ type: REGISTER_REQUEST });
const registerSuccess = token => ({ type: REGISTER_SUCCESS, payload: { token } });
const registerFailure = error => ({ type: REGISTER_FAILURE, payload: error, error: error });
const checkUsernameAvailableRequest = () => ({ type: CHECK_USERNAME_AVAILABLE_REQUEST });
const checkUsernameAvailableSuccess = () => ({ type: CHECK_USERNAME_AVAILABLE_SUCCESS });
const checkUsernameAvailableFailure = (error) => ({ type: CHECK_USERNAME_AVAILABLE_FAILURE, payload: error });
const checkEmailAvailableRequest = () => ({ type: CHECK_EMAIL_AVAILABLE_REQUEST });
const checkEmailAvailableSuccess = () => ({ type: CHECK_EMAIL_AVAILABLE_SUCCESS });
const checkEmailAvailableFailure = (error) => ({ type: CHECK_EMAIL_AVAILABLE_FAILURE, payload: error });


const login = (username, password) => {
  return async dispatch => {
    dispatch(loginRequest());

    try {
      const response = await fetch('/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const session = await response.json();

      // Here we create the database and store the session
      const dbRequest = indexedDB.open(BROWSER_DATABASE_NAME, 1);

      dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(BROWSER_DATABASE_TOKEN_TABLE)) {
          const objectStore = db.createObjectStore(BROWSER_DATABASE_TOKEN_TABLE, { keyPath: 'id' });
          objectStore.createIndex("authToken", "authToken", { unique: false });
        }
      };

      dbRequest.onerror = function (event) {
        console.error('Error opening IndexedDB:', event.target.error);
      };

      dbRequest.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction([BROWSER_DATABASE_TOKEN_TABLE], 'readwrite');
        const store = transaction.objectStore(BROWSER_DATABASE_TOKEN_TABLE);
        store.put({ id: 'authToken', value: session.token });
      };

      dispatch(loginSuccess(session));
    } catch (error) {
      dispatch(loginFailure(error.message));
    }
  };
};


const reLogin = (token) => {
  return async dispatch => {
    try {
      const response = await fetch('/sessionRestore', {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const user = await response.json();
      const session = {
        token: token,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isCompliant: user.isCompliant
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      dispatch(loginSuccess(session));
    } catch (error) {
      dispatch(loginFailure(error.message));
    }
  };
};


const register = (username, password) => {
  return async dispatch => {
    dispatch(registerRequest());

    try {
      const response = await fetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { token } = await response.json();
      dispatch(registerSuccess(token));
    } catch (error) {
      dispatch(registerFailure(error.message));
    }
  };
};

const logout = () => {
  return async dispatch => {
    const request = indexedDB.open(BROWSER_DATABASE_NAME, 1);

    request.onerror = function (event) {
      console.error("IndexedDB error:", event.target.errorCode);
    };

    request.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction([BROWSER_DATABASE_TOKEN_TABLE], 'readwrite');
      const objectStore = transaction.objectStore(BROWSER_DATABASE_TOKEN_TABLE);
      const deleteRequest = objectStore.delete('authToken');

      deleteRequest.onsuccess = function (event) {
        console.log('The token has been removed from IndexedDB');
      };

      deleteRequest.onerror = function (event) {
        console.error("IndexedDB delete error:", event.target.errorCode);
      };
    };
  }
};

const checkUsernameAvailable = (username) => {
  return async (dispatch) => {
    dispatch(checkUsernameAvailableRequest());
    try {

      const response = await fetch(`/users/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      dispatch(checkUsernameAvailableSuccess());
    } catch (error) {
      dispatch(checkUsernameAvailableFailure(error.message));
    }
  }
}

const checkEmailAvailable = (email) => {
  return async (dispatch) => {
    dispatch(checkEmailAvailableRequest());
    try {

      const response = await fetch(`/users/email/${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      dispatch(checkEmailAvailableSuccess());
    } catch (error) {
      dispatch(checkEmailAvailableFailure(error.message));
    }
  }
}

module.exports = {
  login,
  register,
  reLogin,
  logout,
  checkUsernameAvailable,
  checkEmailAvailable,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_REQUEST,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  CHECK_USERNAME_AVAILABLE_REQUEST,
  CHECK_USERNAME_AVAILABLE_SUCCESS,
  CHECK_USERNAME_AVAILABLE_FAILURE,
  CHECK_EMAIL_AVAILABLE_REQUEST,
  CHECK_EMAIL_AVAILABLE_SUCCESS,
  CHECK_EMAIL_AVAILABLE_FAILURE,
};
