'use strict';

// Remove cross-fetch import and use native fetch
// const fetch = require('cross-fetch');

// Action types
const FETCH_RESOURCE_REQUEST = 'FETCH_RESOURCE_REQUEST';
const FETCH_RESOURCE_SUCCESS = 'FETCH_RESOURCE_SUCCESS';
const FETCH_RESOURCE_FAILURE = 'FETCH_RESOURCE_FAILURE';

// Action creators
const fetchResourceRequest = () => ({ type: FETCH_RESOURCE_REQUEST, loading: true });
const fetchResourceSuccess = (resource) => ({ type: FETCH_RESOURCE_SUCCESS, payload: resource, loading: false });
const fetchResourceFailure = (error) => ({ type: FETCH_RESOURCE_FAILURE, payload: error, loading: false });

/**
 * Parse JSON body and throw a consistent Error when `response.ok` is false (browser clients).
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function parseJsonResponse (response) {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const body = data && typeof data === 'object' ? data : {};
    const parts = [body.error, body.message, body.detail, body.content].filter(Boolean);
    const msg = parts.length
      ? parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' — ')
      : `Request failed (${response.status})`;
    const err = new Error(msg);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  return data;
}

async function fetchFromAPI (path, params = {}, token = null) {
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    }
  });

  return parseJsonResponse(response);
}

async function fetchPath (path = location.pathname, token) {
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    }
  });

  return parseJsonResponse(response);
}

async function patchAPI (path, params, token = null) {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify([
      { op: 'replace', path: '/', value: params }
    ])
  });

  return parseJsonResponse(response);
}

async function postAPI (path, params, token = null) {
  const body = typeof params === 'string' ? params : JSON.stringify(params != null ? params : {});
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    },
    body
  });

  return parseJsonResponse(response);
}

const fetchResource = (path = location.pathname, token) => {
  return async (dispatch, getState) => {
    dispatch(fetchResourceRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(path, null, token);
      dispatch(fetchResourceSuccess(instance));
    } catch (error) {
      dispatch(fetchResourceFailure(error));
    }
  };
};

module.exports = {
  FETCH_RESOURCE_REQUEST,
  FETCH_RESOURCE_SUCCESS,
  FETCH_RESOURCE_FAILURE,
  fetchFromAPI,
  parseJsonResponse,
  fetchResource,
  fetchPath,
  patchAPI,
  postAPI
};
