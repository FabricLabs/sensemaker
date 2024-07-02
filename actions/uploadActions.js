'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchUploadsFromAPI(token) {
  // TODO: pagination
  return fetchFromAPI('/files', null, token);
}

// Action types
const FETCH_UPLOADS_REQUEST = 'FETCH_UPLOADS_REQUEST';
const FETCH_UPLOADS_SUCCESS = 'FETCH_UPLOADS_SUCCESS';
const FETCH_UPLOADS_FAILURE = 'FETCH_UPLOADS_FAILURE';
const FETCH_UPLOAD_REQUEST = 'FETCH_UPLOAD_REQUEST';
const FETCH_UPLOAD_SUCCESS = 'FETCH_UPLOAD_SUCCESS';
const FETCH_UPLOAD_FAILURE = 'FETCH_UPLOAD_FAILURE';
const SEARCH_UPLOAD_REQUEST = 'SEARCH_UPLOAD_REQUEST';
const SEARCH_UPLOAD_SUCCESS = 'SEARCH_UPLOAD_SUCCESS';
const SEARCH_UPLOAD_FAILURE = 'SEARCH_UPLOAD_FAILURE';

// Action creators
const fetchUploadsRequest = () => ({ type: FETCH_UPLOADS_REQUEST, loading: true });
const fetchUploadsSuccess = (uploads) => ({ type: FETCH_UPLOADS_SUCCESS, payload: uploads, loading: false });
const fetchUploadsFailure = (error) => ({ type: FETCH_UPLOADS_FAILURE, payload: error, loading: false });

const fetchUploadRequest = () => ({ type: FETCH_UPLOAD_REQUEST, loading: true });
const fetchUploadSuccess = (instance) => ({ type: FETCH_UPLOAD_SUCCESS, payload: instance, loading: false });
const fetchUploadFailure = (error) => ({ type: FETCH_UPLOAD_FAILURE, payload: error, loading: false });

const searchUploadRequest = () => ({ type: SEARCH_UPLOAD_REQUEST });
const searchUploadSuccess = (results) => ({ type: SEARCH_UPLOAD_SUCCESS, payload: results });
const searchUploadFailure = (error) => ({ type: SEARCH_UPLOAD_FAILURE, payload: error });

// Thunk action creator
const fetchUploads = () => {
  return async (dispatch, getState) => {
    dispatch(fetchUploadsRequest());
    const { token } = getState().auth;
    try {
      const uploads = await fetchUploadsFromAPI(token);
      dispatch(fetchUploadsSuccess(uploads));
    } catch (error) {
      dispatch(fetchUploadsFailure(error));
    }
  };
};

const fetchUpload = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchUploadRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/files/${id}`, null, token);
      dispatch(fetchUploadSuccess(instance));
    } catch (error) {
      dispatch(fetchUploadFailure(error));
    }
  };
};

const searchUploads = (query) => {
  return async (dispatch, getState) => {
    dispatch(searchUploadRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch('/files', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'SEARCH',
        body: JSON.stringify({ query }) // TODO: filter search to user's files (at API level)
      });

      const obj = await response.json();
      console.debug('fetch result: ', obj);

      dispatch(searchUploadSuccess(obj.content));
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(searchUploadFailure(error.message));
    }
  }
}

module.exports = {
  fetchUpload,
  fetchUploads,
  searchUploads,
  FETCH_UPLOAD_REQUEST,
  FETCH_UPLOAD_SUCCESS,
  FETCH_UPLOAD_FAILURE,
  SEARCH_UPLOAD_REQUEST,
  SEARCH_UPLOAD_SUCCESS,
  SEARCH_UPLOAD_FAILURE,
  FETCH_UPLOADS_REQUEST,
  FETCH_UPLOADS_SUCCESS,
  FETCH_UPLOADS_FAILURE
};
