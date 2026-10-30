'use strict';

const {
  FETCH_APPLICATIONS_REQUEST,
  FETCH_APPLICATIONS_SUCCESS,
  FETCH_APPLICATIONS_FAILURE,
  FETCH_APPLICATION_REQUEST,
  FETCH_APPLICATION_SUCCESS,
  FETCH_APPLICATION_FAILURE,
  SAVE_APPLICATION_SUCCESS,
  FETCH_AUTHORIZED_APPLICATIONS_SUCCESS,
  REVOKE_APPLICATION_AUTHORIZATION_SUCCESS
} = require('../actions/applicationActions');

const initialState = {
  error: null,
  loading: false,
  application: null,
  applications: [],
  authorized: []
};

function applicationReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_APPLICATIONS_REQUEST:
    case FETCH_APPLICATION_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_APPLICATIONS_SUCCESS:
      return { ...state, applications: action.payload, loading: false };
    case FETCH_APPLICATION_SUCCESS:
      return { ...state, application: action.payload, loading: false };
    case FETCH_APPLICATIONS_FAILURE:
    case FETCH_APPLICATION_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case SAVE_APPLICATION_SUCCESS: {
      const saved = action.payload;
      const others = state.applications.filter((a) => a.id !== saved.id);
      return { ...state, application: saved, applications: [saved].concat(others) };
    }
    case FETCH_AUTHORIZED_APPLICATIONS_SUCCESS:
      return { ...state, authorized: action.payload };
    case REVOKE_APPLICATION_AUTHORIZATION_SUCCESS:
      return {
        ...state,
        authorized: state.authorized.filter((row) => String(row.application.id) !== String(action.payload) &&
          row.application.client_id !== action.payload)
      };
    default:
      return state;
  }
}

module.exports = applicationReducer;
