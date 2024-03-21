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
} = require('../actions/documentActions');

const initialState = {
  document: {},
  documents: [],
  loading: false,
  error: null,
  fileUploaded: false,
  fileId: null,
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
      return { ...state, loading: true, error: null, fileUploaded: false, fileId: null, error: null };
    case UPLOAD_DOCUMENT_SUCCESS:
      return { ...state, loading: false, fileUploaded: true, fileId: action.payload };
    case UPLOAD_DOCUMENT_FAILURE:
      return { ...state, loading: false, error: action.payload, fileUploaded: false, fileId: null };
    default:
      // console.warn('Unhandled action in documents reducer:', action);
      return state;
  }
}

module.exports = documentReducer;
