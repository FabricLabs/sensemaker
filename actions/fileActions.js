'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchFilesFromAPI (token) {
  return fetchFromAPI('/files', null, token);
}

// Action types
const FETCH_FILES_REQUEST = 'FETCH_FILES_REQUEST';
const FETCH_FILES_SUCCESS = 'FETCH_FILES_SUCCESS';
const FETCH_FILES_FAILURE = 'FETCH_FILES_FAILURE';
const FETCH_FILE_REQUEST = 'FETCH_FILE_REQUEST';
const FETCH_FILE_SUCCESS = 'FETCH_FILE_SUCCESS';
const FETCH_FILE_FAILURE = 'FETCH_FILE_FAILURE';

// Action creators
const fetchFilesRequest = () => ({ type: FETCH_FILES_REQUEST, loading: true });
const fetchFilesSuccess = (files) => ({ type: FETCH_FILES_SUCCESS, payload: files, loading: false });
const fetchFilesFailure = (error) => ({ type: FETCH_FILES_FAILURE, payload: error, loading: false  });
const fetchFileRequest = () => ({ type: FETCH_FILE_REQUEST, loading: true });
const fetchFileSuccess = (instance) => ({ type: FETCH_FILE_SUCCESS, payload: instance, loading: false });
const fetchFileFailure = (error) => ({ type: FETCH_FILE_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchFiles = () => {
  return async (dispatch, getState) => {
    dispatch(fetchFilesRequest());
    const { token } = getState().auth;
    try {
      const files = await fetchFilesFromAPI(token);
      dispatch(fetchFilesSuccess(files));
    } catch (error) {
      dispatch(fetchFilesFailure(error));
    }
  };
};

const fetchFile = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchFileRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/files/${id}`, null, token);
      dispatch(fetchFileSuccess(instance));
    } catch (error) {
      dispatch(fetchFileFailure(error));
    }
  };
};

module.exports = {
  fetchFile,
  fetchFiles,
  FETCH_FILE_REQUEST,
  FETCH_FILE_SUCCESS,
  FETCH_FILE_FAILURE,
  FETCH_FILES_REQUEST,
  FETCH_FILES_SUCCESS,
  FETCH_FILES_FAILURE
};
