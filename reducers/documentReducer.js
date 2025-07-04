'use strict';

const {
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
  EDIT_DOCUMENT_REQUEST,
  EDIT_DOCUMENT_SUCCESS,
  EDIT_DOCUMENT_FAILURE,
  DELETE_DOCUMENT_REQUEST,
  DELETE_DOCUMENT_SUCCESS,
  DELETE_DOCUMENT_FAILURE,
  FETCH_COMMIT_REQUEST,
  FETCH_COMMIT_SUCCESS,
  FETCH_COMMIT_FAILURE,
} = require('../actions/documentActions');

const initialState = {
  document: {},
  sections: [],
  documents: [],
  loading: false,
  editing: false,
  saving: false,
  error: null,
  fileUploaded: false,
  // fabric_id: null, //this is the id inserted in table 'files' in the db after creating the file
  results: [],
  creationSuccess: false,
  editionSuccess: false,
  deleteSuccess: false,
  commits: {},
  selectedCommit: null,
  loadingCommit: false,
  commitError: null,
};

function documentReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_DOCUMENT_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_DOCUMENT_SUCCESS:
      return { ...state, loading: false, document: action.payload };
    case FETCH_DOCUMENT_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case FETCH_DOCUMENTS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_DOCUMENTS_SUCCESS:
      return { ...state, loading: false, documents: action.payload };
    case FETCH_DOCUMENTS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case UPLOAD_DOCUMENT_REQUEST:
      return { ...state, loading: true, error: null, fileUploaded: false, fabric_id: null, error: null };
    case UPLOAD_DOCUMENT_SUCCESS:
      return { ...state, loading: false, fileUploaded: true, fabric_id: action.payload, error: null };
    case UPLOAD_DOCUMENT_FAILURE:
      return { ...state, loading: false, error: action.payload, fileUploaded: false, fabric_id: null };

    case SEARCH_DOCUMENT_REQUEST:
      return { ...state, loading: true, error: null, results: [], };
    case SEARCH_DOCUMENT_SUCCESS:
      return { ...state, loading: false, results: action.payload, error: null };
    case SEARCH_DOCUMENT_FAILURE:
      return { ...state, loading: false, error: action.payload, results: [] };

    case CREATE_DOCUMENT_REQUEST:
      return { ...state, creating: true, error: null, document: {}, creationSuccess: false };
    case CREATE_DOCUMENT_SUCCESS:
      console.log(action.payload);
      return { ...state, creating: false, document: action.payload, error: null, creationSuccess: true };
    case CREATE_DOCUMENT_FAILURE:
      return { ...state, creating: false, error: action.payload, document: {}, creationSuccess: false };

    case EDIT_DOCUMENT_REQUEST:
      return { ...state, editing: true, saving: true, error: null, editionSuccess: false };
    case EDIT_DOCUMENT_SUCCESS:
      console.log(action.payload);
      return { ...state, editing: false, saving: false, error: null, document: action.payload , editionSuccess: true };
    case EDIT_DOCUMENT_FAILURE:
      return { ...state, editing: false, saving: false, error: action.payload, editionSuccess: false };

    case DELETE_DOCUMENT_REQUEST:
      return { ...state, editing: true, error: null, deleteSuccess: false };
    case DELETE_DOCUMENT_SUCCESS:
      console.log(action.payload);
      return { ...state, editing: false, error: null, deleteSuccess: true };
    case DELETE_DOCUMENT_FAILURE:
      return { ...state, editing: false, error: action.payload, deleteSuccess: false };

    case FETCH_COMMIT_REQUEST:
      return { ...state, loadingCommit: true, commitError: null };
    case FETCH_COMMIT_SUCCESS:
      return {
        ...state,
        loadingCommit: false,
        selectedCommit: action.payload,
        commits: {
          ...state.commits,
          [action.payload.id]: action.payload
        },
        commitError: null
      };
    case FETCH_COMMIT_FAILURE:
      return { ...state, loadingCommit: false, commitError: action.payload, selectedCommit: null };

    default:
      // console.warn('Unhandled action in documents reducer:', action);
      return state;
  }
}

module.exports = documentReducer;
