'use strict';

const fetch = require('cross-fetch');

// Action Types
const LOGIN_REQUEST = 'LOGIN_REQUEST';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';

// Sync Action Creators
const loginRequest = () => ({ type: LOGIN_REQUEST });
const loginSuccess = token => ({ type: LOGIN_SUCCESS, payload: { token } });
const loginFailure = error => ({ type: LOGIN_FAILURE, payload: error, error: error });

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

      const { token } = await response.json();
      dispatch(loginSuccess(token));
    } catch (error) {
      dispatch(loginFailure(error.message));
    }
  };
};

module.exports = { login, LOGIN_SUCCESS, LOGIN_FAILURE, LOGIN_REQUEST };
