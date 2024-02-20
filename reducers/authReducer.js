'use strict';

const {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  CHECK_USERNAME_AVAILABLE_REQUEST,
  CHECK_USERNAME_AVAILABLE_SUCCESS,
  CHECK_USERNAME_AVAILABLE_FAILURE,
  CHECK_EMAIL_AVAILABLE_REQUEST,
  CHECK_EMAIL_AVAILABLE_SUCCESS,
  CHECK_EMAIL_AVAILABLE_FAILURE,
  FULL_REGISTER_REQUEST,
  FULL_REGISTER_SUCCESS,
  FULL_REGISTER_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,

} = require('../actions/authActions');

const { SIGN_CONTRACT_SUCCESS } = require('../actions/contractActions');

const initialState = {
  isAdmin: false,
  isAuthenticated: false,
  isBeta: false,
  isCompliant: false,
  token: null,
  error: null,
  usernameAvailable: false,
  emailAvailable: false,
  registering: false,
  registerSuccess: false,
  loading: false,
  checking: false,
  shortRegisterError: null,
  shortRegisterSuccess: false,
};

function authReducer(state = initialState, action) {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, isAuthenticated: false, token: null, error: null, loading: true }; // reset state
    case LOGIN_SUCCESS:
      return { ...state, isAuthenticated: true, isAdmin: action.payload.isAdmin || false, isBeta: action.payload.isBeta || false, isCompliant: action.payload.isCompliant || false, username: action.payload.username, email: action.payload.email, token: action.payload.token, loading: false };
    case LOGIN_FAILURE:
      console.debug('login failure:', state, action);
      return { ...state, isAuthenticated: false, token: null, error: action.payload, loading: false };

    case SIGN_CONTRACT_SUCCESS:
      return { ...state, isCompliant: true };

    //actions for checking if the username is available
    case CHECK_USERNAME_AVAILABLE_REQUEST:
      return { ...state, checking: true };
    case CHECK_USERNAME_AVAILABLE_SUCCESS:
      return { ...state, usernameAvailable: true, checking: false, error: null };
    case CHECK_USERNAME_AVAILABLE_FAILURE:
      return { ...state, error: action.payload, usernameAvailable: false, checking: false };

    //actions for checking if the email is not registered
    case CHECK_EMAIL_AVAILABLE_REQUEST:
      return { ...state, checking: true };
    case CHECK_EMAIL_AVAILABLE_SUCCESS:
      return { ...state, emailAvailable: true, checking: false };
    case CHECK_EMAIL_AVAILABLE_FAILURE:
      return { ...state, error: action.payload, emailAvailable: false, checking: false };

    //for short registration with account creator
    case REGISTER_REQUEST:
      return { ...state, loading: true };
    case REGISTER_SUCCESS:
      return { ...state, shortRegisterError: null, shortRegisterSuccess: true, loading: false };
    case REGISTER_FAILURE:
      return { ...state, shortRegisterError: action.payload, shortRegisterSuccess: false, loading: false };

    //actions for registering an user
    case FULL_REGISTER_REQUEST:
      return { ...state, registering: true };
    case FULL_REGISTER_SUCCESS:
      return { ...state, registerSuccess: true, registering: false };
    case FULL_REGISTER_FAILURE:
      return { ...state, error: action.payload, registerSuccess: false, registering: false };
    default:
      return state;
  }
}

module.exports = authReducer;
