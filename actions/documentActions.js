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

const SEARCH_DOCUMENT_REQUEST = 'SEARCH_DOCUMENT_REQUEST';
const SEARCH_DOCUMENT_SUCCESS = 'SEARCH_DOCUMENT_SUCCESS';
const SEARCH_DOCUMENT_FAILURE = 'SEARCH_DOCUMENT_FAILURE';

const CREATE_DOCUMENT_REQUEST = 'CREATE_DOCUMENT_REQUEST';
const CREATE_DOCUMENT_SUCCESS = 'CREATE_DOCUMENT_SUCCESS';
const CREATE_DOCUMENT_FAILURE = 'CREATE_DOCUMENT_FAILURE';

const CREATE_DOCUMENT_SECTION_REQUEST = 'CREATE_DOCUMENT_SECTION_REQUEST';
const CREATE_DOCUMENT_SECTION_SUCCESS = 'CREATE_DOCUMENT_SECTION_SUCCESS';
const CREATE_DOCUMENT_SECTION_FAILURE = 'CREATE_DOCUMENT_SECTION_FAILURE';

const EDIT_DOCUMENT_REQUEST = 'EDIT_DOCUMENT_REQUEST';
const EDIT_DOCUMENT_SUCCESS = 'EDIT_DOCUMENT_SUCCESS';
const EDIT_DOCUMENT_FAILURE = 'EDIT_DOCUMENT_FAILURE';

// Action creators
const fetchDocumentsRequest = () => ({ type: FETCH_DOCUMENTS_REQUEST });
const fetchDocumentsSuccess = (documents) => ({ type: FETCH_DOCUMENTS_SUCCESS, payload: documents });
const fetchDocumentsFailure = (error) => ({ type: FETCH_DOCUMENTS_FAILURE, payload: error });

const fetchDocumentRequest = () => ({ type: FETCH_DOCUMENT_REQUEST });
const fetchDocumentSuccess = (instance) => ({ type: FETCH_DOCUMENT_SUCCESS, payload: instance });
const fetchDocumentFailure = (error) => ({ type: FETCH_DOCUMENT_FAILURE, payload: error });

const uploadDocumentRequest = () => ({ type: UPLOAD_DOCUMENT_REQUEST });
const uploadDocumentSuccess = (fabric_id) => ({ type: UPLOAD_DOCUMENT_SUCCESS, payload: fabric_id });
const uploadDocumentFailure = (error) => ({ type: UPLOAD_DOCUMENT_FAILURE, payload: error });

const searchDocumentRequest = () => ({ type: SEARCH_DOCUMENT_REQUEST });
const searchDocumentSuccess = (results) => ({ type: SEARCH_DOCUMENT_SUCCESS, payload: results });
const searchDocumentFailure = (error) => ({ type: SEARCH_DOCUMENT_FAILURE, payload: error });

const createDocumentRequest = () => ({ type: CREATE_DOCUMENT_REQUEST });
const createDocumentSuccess = (results) => ({ type: CREATE_DOCUMENT_SUCCESS, payload: results });
const createDocumentFailure = (error) => ({ type: CREATE_DOCUMENT_FAILURE, payload: error });

const createSectionRequest = () => ({ type: CREATE_DOCUMENT_SECTION_REQUEST });
const createSectionSuccess = (results) => ({ type: CREATE_DOCUMENT_SECTION_SUCCESS, payload: results });
const createSectionFailure = (error) => ({ type: CREATE_DOCUMENT_SECTION_FAILURE, payload: error });

const editDocumentRequest = () => ({ type: CREATE_DOCUMENT_SECTION_REQUEST });
const editDocumentSuccess = () => ({ type: CREATE_DOCUMENT_SECTION_SUCCESS });
const editDocumentFailure = (error) => ({ type: CREATE_DOCUMENT_SECTION_FAILURE, payload: error });



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

const fetchDocument = (fabricID) => {
  return async (dispatch, getState) => {
    dispatch(fetchDocumentRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/documents/${fabricID}`, null, token);
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

      dispatch(uploadDocumentSuccess(fileAnswer.fabric_id));
    } catch (error) {
      dispatch(uploadDocumentFailure(error.message));
    }

  }
}

const searchDocument = (query) => {
  return async (dispatch, getState) => {
    dispatch(searchDocumentRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch('/documents', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'SEARCH',
        body: JSON.stringify({ query })
      });

      const obj = await response.json();
      console.debug('fetch result: ', obj);

      dispatch(searchDocumentSuccess(obj.content));
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(searchDocumentFailure(error.message));
    }
  }
}

const createDocument = (type,query) => {
  return async (dispatch, getState) => {
    dispatch(createDocumentRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch('/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ type,query })
      });

      const obj = await response.json();
      console.debug('fetch result: ', obj);

      dispatch(createDocumentSuccess(obj.fabric_id));
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(createDocumentFailure(error.message));
    }
  }
}

const createDocumentSection = (fabricID,sectionNumber,title) => {
  return async (dispatch, getState) => {
    dispatch(createSectionRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch(`/documents/${fabricID}/section/${sectionNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ title })
      });

      const obj = await response.json();
      console.debug('fetch result: ', obj);

      dispatch(createSectionSuccess(obj.fabric_id));
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(createSectionFailure(error.message));
    }
  }
}

const editDocument = (document) => {
  return async (dispatch, getState) => {
    dispatch(editDocumentRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch(`/documents/${fabricID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'PATCH',
        body: JSON.stringify({ document })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      dispatch(editDocumentSuccess());
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(editDocumentFailure(error.message));
    }
  }
}



module.exports = {
  fetchDocument,
  fetchDocuments,
  uploadDocument,
  searchDocument,
  createDocument,
  createDocumentSection,
  editDocument,
  FETCH_DOCUMENT_REQUEST,
  FETCH_DOCUMENT_SUCCESS,
  FETCH_DOCUMENT_FAILURE,
  FETCH_DOCUMENTS_REQUEST,
  FETCH_DOCUMENTS_SUCCESS,
  FETCH_DOCUMENTS_FAILURE,
  UPLOAD_DOCUMENT_REQUEST,
  UPLOAD_DOCUMENT_SUCCESS,
  UPLOAD_DOCUMENT_FAILURE,
  SEARCH_DOCUMENT_REQUEST,
  SEARCH_DOCUMENT_SUCCESS,
  SEARCH_DOCUMENT_FAILURE,
  CREATE_DOCUMENT_REQUEST,
  CREATE_DOCUMENT_SUCCESS,
  CREATE_DOCUMENT_FAILURE,
  CREATE_DOCUMENT_SECTION_REQUEST,
  CREATE_DOCUMENT_SECTION_SUCCESS,
  CREATE_DOCUMENT_SECTION_FAILURE,
  EDIT_DOCUMENT_REQUEST,
  EDIT_DOCUMENT_SUCCESS,
  EDIT_DOCUMENT_FAILURE,
};
