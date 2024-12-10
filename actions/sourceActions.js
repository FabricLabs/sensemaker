'use strict';

const fetch = require('cross-fetch');
const { fetchFromAPI } = require('./apiActions');

async function fetchSourcesFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/sources', null, token);
}

// Action types
const FETCH_SOURCES_REQUEST = 'FETCH_SOURCES_REQUEST';
const FETCH_SOURCES_SUCCESS = 'FETCH_SOURCES_SUCCESS';
const FETCH_SOURCES_FAILURE = 'FETCH_SOURCES_FAILURE';

const FETCH_SOURCE_REQUEST = 'FETCH_SOURCE_REQUEST';
const FETCH_SOURCE_SUCCESS = 'FETCH_SOURCE_SUCCESS';
const FETCH_SOURCE_FAILURE = 'FETCH_SOURCE_FAILURE';

const CREATE_SOURCE_REQUEST = 'CREATE_SOURCE_REQUEST';
const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';
const CREATE_SOURCE_FAILURE = 'CREATE_SOURCE_FAILURE';

// Action creators
const fetchSourcesRequest = () => ({ type: FETCH_SOURCES_REQUEST, loading: true });
const fetchSourcesSuccess = (sources) => ({ type: FETCH_SOURCES_SUCCESS, payload: sources, loading: false });
const fetchSourcesFailure = (error) => ({ type: FETCH_SOURCES_FAILURE, payload: error, loading: false });

const fetchSourceRequest = () => ({ type: FETCH_SOURCE_REQUEST, loading: true });
const fetchSourceSuccess = (instance) => ({ type: FETCH_SOURCE_SUCCESS, payload: instance, loading: false });
const fetchSourceFailure = (error) => ({ type: FETCH_SOURCE_FAILURE, payload: error, loading: false });

const createSourceRequest = (email) => ({ type: CREATE_SOURCE_REQUEST, payload: email });
const createSourceSuccess = () => ({ type: CREATE_SOURCE_SUCCESS });
const createSourceFailure = (error) => ({ type: CREATE_SOURCE_FAILURE, payload: error });

// Thunk action creator
const fetchSources = () => {
  return async (dispatch, getState) => {
    dispatch(fetchSourcesRequest());
    const { token } = getState().auth;
    try {
      const sources = await fetchSourcesFromAPI(token);
      dispatch(fetchSourcesSuccess(sources));
    } catch (error) {
      dispatch(fetchSourcesFailure(error));
    }
  };
};

const fetchSource = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchSourceRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/sources/${id}`, null, token);
      dispatch(fetchSourceSuccess(instance));
    } catch (error) {
      dispatch(fetchSourceFailure(error));
    }
  };
};

const createSource = (source) => {
  return async (dispatch, getState) => {
    dispatch(createSourceRequest(source));
    const { token } = getState().auth;
    try {
      // call for the fetch that generates the token for password reset
      const fetchPromise = fetch('/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(source),
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Could not create source.  Please try again.'));
        }, 60000);
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      dispatch(createSourceSuccess());
    } catch (error) {
      dispatch(createSourceFailure(error));
    }
  };
}

module.exports = {
  fetchSource,
  fetchSources,
  createSource,
  FETCH_SOURCE_REQUEST,
  FETCH_SOURCE_SUCCESS,
  FETCH_SOURCE_FAILURE,
  FETCH_SOURCES_REQUEST,
  FETCH_SOURCES_SUCCESS,
  FETCH_SOURCES_FAILURE,
  CREATE_SOURCE_REQUEST,
  CREATE_SOURCE_SUCCESS,
  CREATE_SOURCE_FAILURE,
};
