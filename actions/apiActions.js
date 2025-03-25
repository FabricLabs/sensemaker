'use strict';

const fetch = require('node-fetch');

// Action types
const FETCH_RESOURCE_REQUEST = 'FETCH_RESOURCE_REQUEST';
const FETCH_RESOURCE_SUCCESS = 'FETCH_RESOURCE_SUCCESS';
const FETCH_RESOURCE_FAILURE = 'FETCH_RESOURCE_FAILURE';

// Action creators
const fetchResourceRequest = () => ({ type: FETCH_RESOURCE_REQUEST, loading: true });
const fetchResourceSuccess = (resource) => ({ type: FETCH_RESOURCE_SUCCESS, payload: resource, loading: false });
const fetchResourceFailure = (error) => ({ type: FETCH_RESOURCE_FAILURE, payload: error, loading: false });

async function fetchFromAPI (path, params = {}, token = null) {
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    }
  });

  return await response.json();
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

  return response.json();
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

  return await response.json();
}

async function postAPI (path, params, token = null) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    },
    body: params
  });

  return await response.json();
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
  fetchResource,
  fetchPath,
  patchAPI,
  postAPI
};
