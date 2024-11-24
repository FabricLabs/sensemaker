'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchKeysFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/keys', null, token);
}

// Action types
const FETCH_KEYS_REQUEST = 'FETCH_KEYS_REQUEST';
const FETCH_KEYS_SUCCESS = 'FETCH_KEYS_SUCCESS';
const FETCH_KEYS_FAILURE = 'FETCH_KEYS_FAILURE';

const FETCH_KEY_REQUEST = 'FETCH_KEY_REQUEST';
const FETCH_KEY_SUCCESS = 'FETCH_KEY_SUCCESS';
const FETCH_KEY_FAILURE = 'FETCH_KEY_FAILURE';

const CREATE_KEY_REQUEST = 'CREATE_KEY_REQUEST';
const CREATE_KEY_SUCCESS = 'CREATE_KEY_SUCCESS';
const CREATE_KEY_FAILURE = 'CREATE_KEY_FAILURE';

// Action creators
const fetchKeysRequest = () => ({ type: FETCH_KEYS_REQUEST, loading: true });
const fetchKeysSuccess = (keys) => ({ type: FETCH_KEYS_SUCCESS, payload: keys, loading: false });
const fetchKeysFailure = (error) => ({ type: FETCH_KEYS_FAILURE, payload: error, loading: false });

const fetchKeyRequest = () => ({ type: FETCH_KEY_REQUEST, loading: true });
const fetchKeySuccess = (instance) => ({ type: FETCH_KEY_SUCCESS, payload: instance, loading: false });
const fetchKeyFailure = (error) => ({ type: FETCH_KEY_FAILURE, payload: error, loading: false });

const createKeyRequest = (email) => ({ type: CREATE_KEY_REQUEST, payload: email });
const createKeySuccess = () => ({ type: CREATE_KEY_SUCCESS });
const createKeyFailure = (error) => ({ type: CREATE_KEY_FAILURE, payload: error });

// Thunk action creator
const fetchKeys = () => {
  return async (dispatch, getState) => {
    dispatch(fetchKeysRequest());
    const { token } = getState().auth;
    try {
      const keys = await fetchKeysFromAPI(token);
      dispatch(fetchKeysSuccess(keys));
    } catch (error) {
      dispatch(fetchKeysFailure(error));
    }
  };
};

const fetchKey = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchKeyRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/keys/${id}`, null, token);
      dispatch(fetchKeySuccess(instance));
    } catch (error) {
      dispatch(fetchKeyFailure(error));
    }
  };
};

const createKey = (task) => {
  return async (dispatch, getState) => {
    dispatch(createKeyRequest(task));
    const { token } = getState().auth;
    try {
      // call for the fetch that generates the token for password reset
      const fetchPromise = fetch('/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Could not create task.  Please try again.'));
        }, 60000);
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      //task with reset token sent
      dispatch(createKeySuccess());
    } catch (error) {
      dispatch(createKeyFailure(error));
    }
  };
}

module.exports = {
  fetchKey,
  fetchKeys,
  createKey,
  FETCH_KEY_REQUEST,
  FETCH_KEY_SUCCESS,
  FETCH_KEY_FAILURE,
  FETCH_KEYS_REQUEST,
  FETCH_KEYS_SUCCESS,
  FETCH_KEYS_FAILURE,
  CREATE_KEY_REQUEST,
  CREATE_KEY_SUCCESS,
  CREATE_KEY_FAILURE,
};
