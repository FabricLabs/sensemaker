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

const FETCH_DOCUMENT_SECTIONS_REQUEST = 'FETCH_DOCUMENT_SECTIONS_REQUEST';
const FETCH_DOCUMENT_SECTIONS_SUCCESS = 'FETCH_DOCUMENT_SECTIONS_SUCCESS';
const FETCH_DOCUMENT_SECTIONS_FAILURE = 'FETCH_DOCUMENT_SECTIONS_FAILURE';

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

const EDIT_DOCUMENT_SECTION_REQUEST = 'EDIT_DOCUMENT_SECTION_REQUEST';
const EDIT_DOCUMENT_SECTION_SUCCESS = 'EDIT_DOCUMENT_SECTION_SUCCESS';
const EDIT_DOCUMENT_SECTION_FAILURE = 'EDIT_DOCUMENT_SECTION_FAILURE';

const EDIT_DOCUMENT_REQUEST = 'EDIT_DOCUMENT_REQUEST';
const EDIT_DOCUMENT_SUCCESS = 'EDIT_DOCUMENT_SUCCESS';
const EDIT_DOCUMENT_FAILURE = 'EDIT_DOCUMENT_FAILURE';

const DELETE_DOCUMENT_REQUEST = 'DELETE_DOCUMENT_REQUEST';
const DELETE_DOCUMENT_SUCCESS = 'DELETE_DOCUMENT_SUCCESS';
const DELETE_DOCUMENT_FAILURE = 'DELETE_DOCUMENT_FAILURE';

// Action creators
const fetchDocumentsRequest = () => ({ type: FETCH_DOCUMENTS_REQUEST });
const fetchDocumentsSuccess = (documents) => ({ type: FETCH_DOCUMENTS_SUCCESS, payload: documents });
const fetchDocumentsFailure = (error) => ({ type: FETCH_DOCUMENTS_FAILURE, payload: error });

const fetchDocumentRequest = () => ({ type: FETCH_DOCUMENT_REQUEST });
const fetchDocumentSuccess = (instance) => ({ type: FETCH_DOCUMENT_SUCCESS, payload: instance });
const fetchDocumentFailure = (error) => ({ type: FETCH_DOCUMENT_FAILURE, payload: error });

const fetchDocumentSectionsRequest = () => ({ type: FETCH_DOCUMENT_SECTIONS_REQUEST });
const fetchDocumentSectionsSuccess = (sections) => ({ type: FETCH_DOCUMENT_SECTIONS_SUCCESS, payload: sections });
const fetchDocumentSectionsFailure = (error) => ({ type: FETCH_DOCUMENT_SECTIONS_FAILURE, payload: error });

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
const createSectionSuccess = () => ({ type: CREATE_DOCUMENT_SECTION_SUCCESS });
const createSectionFailure = (error) => ({ type: CREATE_DOCUMENT_SECTION_FAILURE, payload: error });

const editSectionRequest = () => ({ type: EDIT_DOCUMENT_SECTION_REQUEST });
const editSectionSuccess = () => ({ type: EDIT_DOCUMENT_SECTION_SUCCESS });
const editSectionFailure = (error) => ({ type: EDIT_DOCUMENT_SECTION_FAILURE, payload: error });

const editDocumentRequest = () => ({ type: EDIT_DOCUMENT_REQUEST });
const editDocumentSuccess = () => ({ type: EDIT_DOCUMENT_SUCCESS });
const editDocumentFailure = (error) => ({ type: EDIT_DOCUMENT_FAILURE, payload: error });

const deleteDocumentRequest = () => ({ type: DELETE_DOCUMENT_REQUEST });
const deleteDocumentSuccess = () => ({ type: DELETE_DOCUMENT_SUCCESS });
const deleteDocumentFailure = (error) => ({ type: DELETE_DOCUMENT_FAILURE, payload: error });



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

const fetchDocumentSections = (document_id) => {
  return async (dispatch, getState) => {
    dispatch(fetchDocumentSectionsRequest());
    const { token } = getState().auth.token;
    try {
      const sections = await fetchFromAPI(`/documents/sections/${document_id}`, null, token);
      dispatch(fetchDocumentSectionsSuccess(sections));
    } catch (error) {
      dispatch(fetchDocumentSectionsFailure(error));
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
//this starts the document outline, its called in step 2 from document drafter
const createDocument = (type, query) => {
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
        body: JSON.stringify({ type, query })
      });

      const obj = await response.json();
      console.debug('fetch result: ', obj);

      dispatch(createDocumentSuccess(obj));
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(createDocumentFailure(error.message));
    }
  }
}

//this creates a new document section, it needs document fabricID, the order number that section will have and its title
//can be called in step 3 when the user, and in the document view edit mode.
const createDocumentSection = (fabricID, target, title, content = null) => {
  return async (dispatch, getState) => {
    dispatch(createSectionRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch(`/documents/${fabricID}/section/${target}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ title, content })
      });

      const obj = await response.json();
      console.debug('fetch result: ', obj);

      dispatch(createSectionSuccess());
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(createSectionFailure(error.message));
    }
  }
}

//this edits the document section, first we wont be editing content
const editDocumentSection = (fabricID, target, title, content = null) => {
  return async (dispatch, getState) => {
    dispatch(editSectionRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch(`/documents/${fabricID}/section/${target}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'PATCH',
        body: JSON.stringify({ title, content })
      });

      const obj = await response.json();
      console.debug('fetch result: ', obj);

      dispatch(editSectionSuccess());
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(editSectionFailure(error.message));
    }
  }
}

//this will be called in the document view
//right now its sending a whole document, that will have the user's changes
//in the API we should use that objet to update the documet
//not 100% about doing it this way, it might be changed
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

//this sets the document status to deleted
//remember to add the last migration
const deleteDocument = (fabricID) => {
  return async (dispatch, getState) => {
    dispatch(deleteDocumentRequest());
    const { token } = getState().auth;
    try {
      const response = await fetch(`/documents/delete/${fabricID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'PATCH',
        body: JSON.stringify({ fabricID })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      dispatch(deleteDocumentSuccess());
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch(deleteDocumentFailure(error.message));
    }
  }
}



module.exports = {
  fetchDocument,
  fetchDocuments,
  fetchDocumentSections,
  uploadDocument,
  searchDocument,
  createDocument,
  createDocumentSection,
  editDocumentSection,
  editDocument,
  deleteDocument,
  FETCH_DOCUMENT_REQUEST,
  FETCH_DOCUMENT_SUCCESS,
  FETCH_DOCUMENT_FAILURE,
  FETCH_DOCUMENTS_REQUEST,
  FETCH_DOCUMENTS_SUCCESS,
  FETCH_DOCUMENTS_FAILURE,
  FETCH_DOCUMENT_SECTIONS_REQUEST,
  FETCH_DOCUMENT_SECTIONS_SUCCESS,
  FETCH_DOCUMENT_SECTIONS_FAILURE,
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
  EDIT_DOCUMENT_SECTION_REQUEST,
  EDIT_DOCUMENT_SECTION_SUCCESS,
  EDIT_DOCUMENT_SECTION_FAILURE,
  EDIT_DOCUMENT_REQUEST,
  EDIT_DOCUMENT_SUCCESS,
  EDIT_DOCUMENT_FAILURE,
  DELETE_DOCUMENT_REQUEST,
  DELETE_DOCUMENT_SUCCESS,
  DELETE_DOCUMENT_FAILURE,
};
