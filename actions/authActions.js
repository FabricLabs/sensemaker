'use strict';

const fetch = require('cross-fetch');

// Action Types
const LOGIN_REQUEST = 'LOGIN_REQUEST';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';
const REGISTER_REQUEST = 'REGISTER_REQUEST';
const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
const REGISTER_FAILURE = 'REGISTER_FAILURE';

// Sync Action Creators
const loginRequest = () => ({ type: LOGIN_REQUEST });
const loginSuccess = (session) => ({ type: LOGIN_SUCCESS, payload: session });
const loginFailure = error => ({ type: LOGIN_FAILURE, payload: error, error: error });
const registerRequest = () => ({ type: REGISTER_REQUEST });
const registerSuccess = token => ({ type: REGISTER_SUCCESS, payload: { token } });
const registerFailure = error => ({ type: REGISTER_FAILURE, payload: error, error: error });

// Async Action Creator (Thunk)
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
      localStorage.setItem('authSession', JSON.stringify(session)); // Persist the token


      dispatch(loginSuccess(session));
    } catch (error) {
      dispatch(loginFailure(error.message));
    }
  };
};

const loggedIn = (session) => {
  return async dispatch => {
   // dispatch(loginRequest());

    try {
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
    const transaction = db.transaction(["tokens"], "readwrite");
    const store = transaction.objectStore("tokens");
    store.delete("authToken");
  }
};

module.exports = {
  login,
  register,
  loggedIn,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_REQUEST,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE
};
