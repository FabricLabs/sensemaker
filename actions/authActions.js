'use strict';

// Constants
const {
  BROWSER_DATABASE_NAME,
  BROWSER_DATABASE_TOKEN_TABLE
} = require('../constants');

// Dependencies
const fetch = require('cross-fetch');

const createTimeoutPromise = require('../functions/createTimeoutPromise');

// Action Types
const LOGIN_REQUEST = 'LOGIN_REQUEST';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';

const REGISTER_REQUEST = 'REGISTER_REQUEST';
const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
const REGISTER_FAILURE = 'REGISTER_FAILURE';

const FULL_REGISTER_REQUEST = 'FULL_REGISTER_REQUEST';
const FULL_REGISTER_SUCCESS = 'FULL_REGISTER_SUCCESS';
const FULL_REGISTER_FAILURE = 'FULL_REGISTER_FAILURE';

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

const fullRegisterRequest = () => ({ type: FULL_REGISTER_REQUEST });
const fullRegisterSuccess = (response) => ({ type: FULL_REGISTER_SUCCESS });
const fullRegisterFailure = (error) => ({ type: FULL_REGISTER_FAILURE, payload: error, error: error });

const checkUsernameAvailableRequest = () => ({ type: CHECK_USERNAME_AVAILABLE_REQUEST });
const checkUsernameAvailableSuccess = () => ({ type: CHECK_USERNAME_AVAILABLE_SUCCESS });
const checkUsernameAvailableFailure = (error) => ({ type: CHECK_USERNAME_AVAILABLE_FAILURE, payload: error });

const checkEmailAvailableRequest = () => ({ type: CHECK_EMAIL_AVAILABLE_REQUEST });
const checkEmailAvailableSuccess = () => ({ type: CHECK_EMAIL_AVAILABLE_SUCCESS });
const checkEmailAvailableFailure = (error) => ({ type: CHECK_EMAIL_AVAILABLE_FAILURE, payload: error });

const login = (username, password) => {
  return async dispatch => {
    dispatch(loginRequest());
    //  IMPORTANT: NOW USERNAME CAN BE THE USER'S EMAIL
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

      // Assign to cookie
      document.cookie = `token=${session.token}; path=/;`;

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
    dispatch(loginRequest());
    try {
      const response = await fetch('/sessions/current', {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const user = await response.json();
      const session = {
        token: token,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isBeta: user.isBeta,
        isCompliant: user.isCompliant,
        user_discord: user.user_discord,
        id: user.id
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

const fullRegister = (username, password, email, firstName, lastName, firmName, firmSize) => {
  return async (dispatch) => {
    dispatch(fullRegisterRequest());

    try {
      //this creates a timeout promise of 15000 ms, which returns the string msg there.
      const timeoutPromise = createTimeoutPromise(15000, 'Registration could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@sensemaker.io.');
      const fetchPromise = fetch('/users/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email, firstName, lastName, firmName, firmSize }),
      });

      //promise.race runs the two promises, and returns the answer from the one that ends up first
      //this means if the fetch goes well it will return with the answer, but if there are some network problems
      //the timeout will end up first, and cuts, this is to stop the app to hang loading waiting for an api answer forever

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      dispatch(fullRegisterSuccess(response));
    } catch (error) {
      dispatch(fullRegisterFailure(error.message));
    }
  }
}

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
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // write over cookie
      };

      deleteRequest.onerror = function (event) {
        console.error("IndexedDB delete error:", event.target.errorCode);
        alert('Something went wrong while securely erasing your session. Please try again.');
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
  fullRegister,
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
  FULL_REGISTER_REQUEST,
  FULL_REGISTER_SUCCESS,
  FULL_REGISTER_FAILURE,
};
