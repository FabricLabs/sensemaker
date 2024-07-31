'use strict';

const { fetchFromAPI } = require('./apiActions');
const createTimeoutPromise = require('../functions/createTimeoutPromise');

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

const UPLOAD_FILE_REQUEST = 'UPLOAD_FILE_REQUEST';
const UPLOAD_FILE_SUCCESS = 'UPLOAD_FILE_SUCCESS';
const UPLOAD_FILE_FAILURE = 'UPLOAD_FILE_FAILURE';



// Action creators
const fetchFilesRequest = () => ({ type: FETCH_FILES_REQUEST, loading: true });
const fetchFilesSuccess = (files) => ({ type: FETCH_FILES_SUCCESS, payload: files, loading: false });
const fetchFilesFailure = (error) => ({ type: FETCH_FILES_FAILURE, payload: error, loading: false  });

const fetchFileRequest = () => ({ type: FETCH_FILE_REQUEST, loading: true });
const fetchFileSuccess = (instance) => ({ type: FETCH_FILE_SUCCESS, payload: instance, loading: false });
const fetchFileFailure = (error) => ({ type: FETCH_FILE_FAILURE, payload: error, loading: false });

const uploadFileRequest = () => ({ type: UPLOAD_FILE_REQUEST });
const uploadFileSuccess = (fabric_id) => ({ type: UPLOAD_FILE_SUCCESS, payload: fabric_id });
const uploadFileFailure = (error) => ({ type: UPLOAD_FILE_FAILURE, payload: error });

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

//this will be used to look for the logged user's files
const fetchUserFiles = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchFilesRequest());
    const { token } = getState().auth;
    try {
      const files = await fetchFromAPI(`/files/user/${id}`, null, token);
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

const uploadFile = (file) => {
  return async (dispatch, getState) => {
    dispatch(uploadFileRequest());
    try {
      const { token } = getState().auth;
      const timeoutPromise = createTimeoutPromise(1200000, 'File upload could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.');

      const data = new FormData();

      data.append('name', file.name);
      data.append('file', file);

      const fetchPromise = await fetch('/files', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        method: 'POST',
        body: data
      });

      const fileCreation = await Promise.race([timeoutPromise, fetchPromise]);

      if (!fileCreation.ok) {
        const errorData = await fileCreation.json();
        throw new Error(errorData.message || 'Server error');
      }

      const fileAnswer = await fileCreation.json();

      dispatch(uploadFileSuccess(fileAnswer.fabric_id));
    } catch (error) {
      dispatch(uploadFileFailure(error.message));
    }

  }
}

module.exports = {
  fetchFile,
  fetchFiles,
  fetchUserFiles,
  uploadFile,
  FETCH_FILE_REQUEST,
  FETCH_FILE_SUCCESS,
  FETCH_FILE_FAILURE,
  FETCH_FILES_REQUEST,
  FETCH_FILES_SUCCESS,
  FETCH_FILES_FAILURE,
  UPLOAD_FILE_REQUEST,
  UPLOAD_FILE_SUCCESS,
  UPLOAD_FILE_FAILURE,
};
