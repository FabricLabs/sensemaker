const {
  FETCH_FILE_REQUEST,
  FETCH_FILE_SUCCESS,
  FETCH_FILE_FAILURE,
  FETCH_FILES_REQUEST,
  FETCH_FILES_SUCCESS,
  FETCH_FILES_FAILURE,
  UPLOAD_FILE_REQUEST,
  UPLOAD_FILE_SUCCESS,
  UPLOAD_FILE_FAILURE,
  SEARCH_FILE_REQUEST,
  SEARCH_FILE_SUCCESS,
  SEARCH_FILE_FAILURE,

} = require('../actions/fileActions');

const initialState = {
  file: {},
  files: [],
  loading: false,
  error: null,
  fileUploaded: false,
  fabric_id: null, //this is the id inserted in table 'files' in the db after creating the file
  results: [],
};

function fileReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_FILE_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_FILE_SUCCESS:
      return { ...state, loading: false, file: action.payload };
    case FETCH_FILE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_FILES_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_FILES_SUCCESS:
      return { ...state, loading: false, files: action.payload };
    case FETCH_FILES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case UPLOAD_FILE_REQUEST:
      return { ...state, loading: true, error: null, fileUploaded: false, fabric_id: null, error: null };
    case UPLOAD_FILE_SUCCESS:
      return { ...state, loading: false, fileUploaded: true, fabric_id: action.payload, error: null };
    case UPLOAD_FILE_FAILURE:
      return { ...state, loading: false, error: action.payload, fileUploaded: false, fabric_id: null };
    case SEARCH_FILE_REQUEST:
      return { ...state, loading: true, error: null, results: [], };
    case SEARCH_FILE_SUCCESS:
      return { ...state, loading: false, results: action.payload, error: null };
    case SEARCH_FILE_FAILURE:
      return { ...state, loading: false, error: action.payload, results: [] };
    default:
      // console.warn('Unhandled action in files reducer:', action);
      return state;
  }
}

module.exports = fileReducer;
