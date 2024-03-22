'use strict';

const { fetchFromAPI } = require('./apiActions');
const createTimeoutPromise = require('../functions/createTimeoutPromise');


async function fetchDocumentsFromAPI(token) {
  return fetchFromAPI('/documents', null, token);
}

// Action types
const FETCH_DOCUMENTS_REQUEST = 'FETCH_DOCUMENTS_REQUEST';
const FETCH_DOCUMENTS_SUCCESS = 'FETCH_DOCUMENTS_SUCCESS';
const FETCH_DOCUMENTS_FAILURE = 'FETCH_DOCUMENTS_FAILURE';

const FETCH_DOCUMENT_REQUEST = 'FETCH_DOCUMENT_REQUEST';
const FETCH_DOCUMENT_SUCCESS = 'FETCH_DOCUMENT_SUCCESS';
const FETCH_DOCUMENT_FAILURE = 'FETCH_DOCUMENT_FAILURE';

const UPLOAD_DOCUMENT_REQUEST = 'UPLOAD_DOCUMENT_REQUEST';
const UPLOAD_DOCUMENT_SUCCESS = 'UPLOAD_DOCUMENT_SUCCESS';
const UPLOAD_DOCUMENT_FAILURE = 'UPLOAD_DOCUMENT_FAILURE';


// Action creators
const fetchDocumentsRequest = () => ({ type: FETCH_DOCUMENTS_REQUEST });
const fetchDocumentsSuccess = (documents) => ({ type: FETCH_DOCUMENTS_SUCCESS, payload: documents });
const fetchDocumentsFailure = (error) => ({ type: FETCH_DOCUMENTS_FAILURE, payload: error });

const fetchDocumentRequest = () => ({ type: FETCH_DOCUMENT_REQUEST });
const fetchDocumentSuccess = (instance) => ({ type: FETCH_DOCUMENT_SUCCESS, payload: instance });
const fetchDocumentFailure = (error) => ({ type: FETCH_DOCUMENT_FAILURE, payload: error });

const uploadDocumentRequest = () => ({ type: UPLOAD_DOCUMENT_REQUEST });
const uploadDocumentSuccess = (file_id) => ({ type: UPLOAD_DOCUMENT_SUCCESS, payload: file_id });
const uploadDocumentFailure = (error) => ({ type: UPLOAD_DOCUMENT_FAILURE, payload: error });

// Thunk action creator
const fetchDocuments = () => {
  return async (dispatch, getState) => {
    dispatch(fetchDocumentsRequest());
    const { token } = getState().auth;
    try {
      const documents = await fetchDocumentsFromAPI(token);
      dispatch(fetchDocumentsSuccess(documents));
    } catch (error) {
      dispatch(fetchDocumentsFailure(error));
    }
  };
};

const fetchDocument = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchDocumentRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/documents/${id}`, null, token);
      dispatch(fetchDocumentSuccess(instance));
    } catch (error) {
      dispatch(fetchDocumentFailure(error));
    }
  };
};

const uploadDocument = (file) => {
  return async (dispatch, getState) => {
    dispatch(uploadDocumentRequest());
    try {
      const { token } = getState().auth;
      const timeoutPromise = createTimeoutPromise(60000, 'File upload could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.');

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

      dispatch(uploadDocumentSuccess(fileAnswer.file_id));
    } catch (error) {
      dispatch(uploadDocumentFailure(error.message));
    }

  }
}

module.exports = {
  fetchDocument,
  fetchDocuments,
  uploadDocument,
  FETCH_DOCUMENT_REQUEST,
  FETCH_DOCUMENT_SUCCESS,
  FETCH_DOCUMENT_FAILURE,
  FETCH_DOCUMENTS_REQUEST,
  FETCH_DOCUMENTS_SUCCESS,
  FETCH_DOCUMENTS_FAILURE,
  UPLOAD_DOCUMENT_REQUEST,
  UPLOAD_DOCUMENT_SUCCESS,
  UPLOAD_DOCUMENT_FAILURE,
};
