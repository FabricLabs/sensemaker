'use strict';

async function requestApplications (method, path, token, body) {
  const response = await fetch(path, {
    method,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error_description || result.error || `Request failed (${response.status}).`);
  return result;
}

// Action types
const FETCH_APPLICATIONS_REQUEST = 'FETCH_APPLICATIONS_REQUEST';
const FETCH_APPLICATIONS_SUCCESS = 'FETCH_APPLICATIONS_SUCCESS';
const FETCH_APPLICATIONS_FAILURE = 'FETCH_APPLICATIONS_FAILURE';
const FETCH_APPLICATION_REQUEST = 'FETCH_APPLICATION_REQUEST';
const FETCH_APPLICATION_SUCCESS = 'FETCH_APPLICATION_SUCCESS';
const FETCH_APPLICATION_FAILURE = 'FETCH_APPLICATION_FAILURE';
const SAVE_APPLICATION_SUCCESS = 'SAVE_APPLICATION_SUCCESS';
const FETCH_AUTHORIZED_APPLICATIONS_SUCCESS = 'FETCH_AUTHORIZED_APPLICATIONS_SUCCESS';
const REVOKE_APPLICATION_AUTHORIZATION_SUCCESS = 'REVOKE_APPLICATION_AUTHORIZATION_SUCCESS';

// Action creators
const fetchApplications = () => {
  return async (dispatch, getState) => {
    dispatch({ type: FETCH_APPLICATIONS_REQUEST });
    const { token } = getState().auth;
    try {
      const applications = await requestApplications('GET', '/applications', token);
      dispatch({ type: FETCH_APPLICATIONS_SUCCESS, payload: applications });
    } catch (error) {
      dispatch({ type: FETCH_APPLICATIONS_FAILURE, payload: error.message });
    }
  };
};

const fetchApplication = (id) => {
  return async (dispatch, getState) => {
    dispatch({ type: FETCH_APPLICATION_REQUEST });
    const { token } = getState().auth;
    try {
      const application = await requestApplications('GET', `/applications/${encodeURIComponent(id)}`, token);
      dispatch({ type: FETCH_APPLICATION_SUCCESS, payload: application });
    } catch (error) {
      dispatch({ type: FETCH_APPLICATION_FAILURE, payload: error.message });
    }
  };
};

/**
 * Thunks below resolve with the saved Application or throw, so forms can show errors.
 */
const createApplication = (fields) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    const application = await requestApplications('POST', '/applications', token, fields);
    dispatch({ type: SAVE_APPLICATION_SUCCESS, payload: application });
    return application;
  };
};

const updateApplication = (id, fields) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    const application = await requestApplications('PATCH', `/applications/${encodeURIComponent(id)}`, token, fields);
    dispatch({ type: SAVE_APPLICATION_SUCCESS, payload: application });
    return application;
  };
};

const disableApplication = (id) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    const application = await requestApplications('DELETE', `/applications/${encodeURIComponent(id)}`, token);
    dispatch({ type: SAVE_APPLICATION_SUCCESS, payload: application });
    return application;
  };
};

const fetchAuthorizedApplications = () => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    try {
      const authorized = await requestApplications('GET', '/applications/authorized', token);
      dispatch({ type: FETCH_AUTHORIZED_APPLICATIONS_SUCCESS, payload: authorized });
    } catch (error) {
      dispatch({ type: FETCH_APPLICATIONS_FAILURE, payload: error.message });
    }
  };
};

const revokeApplicationAuthorization = (id) => {
  return async (dispatch, getState) => {
    const { token } = getState().auth;
    await requestApplications('DELETE', `/applications/${encodeURIComponent(id)}/authorization`, token);
    dispatch({ type: REVOKE_APPLICATION_AUTHORIZATION_SUCCESS, payload: id });
  };
};

module.exports = {
  fetchApplications,
  fetchApplication,
  createApplication,
  updateApplication,
  disableApplication,
  fetchAuthorizedApplications,
  revokeApplicationAuthorization,
  FETCH_APPLICATIONS_REQUEST,
  FETCH_APPLICATIONS_SUCCESS,
  FETCH_APPLICATIONS_FAILURE,
  FETCH_APPLICATION_REQUEST,
  FETCH_APPLICATION_SUCCESS,
  FETCH_APPLICATION_FAILURE,
  SAVE_APPLICATION_SUCCESS,
  FETCH_AUTHORIZED_APPLICATIONS_SUCCESS,
  REVOKE_APPLICATION_AUTHORIZATION_SUCCESS
};
