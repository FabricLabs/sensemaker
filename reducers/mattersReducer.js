const {
  FETCH_MATTERS_REQUEST,
  FETCH_MATTERS_SUCCESS,
  FETCH_MATTERS_FAILURE,
  FETCH_MATTER_REQUEST,
  FETCH_MATTER_SUCCESS,
  FETCH_MATTER_FAILURE,
  CREATE_MATTER_REQUEST,
  CREATE_MATTER_SUCCESS,
  CREATE_MATTER_FAILURE,
  EDIT_MATTER_REQUEST,
  EDIT_MATTER_SUCCESS,
  EDIT_MATTER_FAILURE,
  ADD_CONTEXT_REQUEST,
  ADD_CONTEXT_SUCCESS,
  ADD_CONTEXT_FAILURE,
  REMOVE_FILE_REQUEST,
  REMOVE_FILE_SUCCESS,
  REMOVE_FILE_FAILURE,
} = require('../actions/mattersActions');


const initialState = {
  current: {},
  error: null,
  loading: false,
  sending: false,
  matters: null,
  creationSuccess: false,
  idCreated: null,
  contextSuccess: false,
  editingSuccess: true,
  fileDeletion: false,
};

function mattersReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_MATTERS_REQUEST:
      return { ...state, loading: true };
    case FETCH_MATTERS_SUCCESS:
      return { ...state, matters: action.payload, loading: false };
    case FETCH_MATTERS_FAILURE:
      console.debug('fetch matters failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    case FETCH_MATTER_REQUEST:
      return { ...state, loading: true };
    case FETCH_MATTER_SUCCESS:
      return { ...state, current: action.payload, loading: false };
    case FETCH_MATTER_FAILURE:
      console.debug('fetch matters failure:', state, action);
      return { ...state, error: action.payload, current: {}, loading: false };
    case CREATE_MATTER_REQUEST:
      return { ...state, loading: true };
    case CREATE_MATTER_SUCCESS:
      return { ...state, creationSuccess: true, idCreated: action.payload.content.id, loading: false };
    case CREATE_MATTER_FAILURE:
      console.debug('create matter failure:', state, action);
      return { ...state, error: action.payload, creationSuccess: false, idCreated: null, loading: false };
    case EDIT_MATTER_REQUEST:
      return { ...state, loading: true };
    case EDIT_MATTER_SUCCESS:
      return { ...state, editingSuccess: true, loading: false };
    case EDIT_MATTER_FAILURE:
      console.debug('edit matter failure:', state, action);
      return { ...state, error: action.payload, editingSuccess: false, idCreated: null };
    case ADD_CONTEXT_REQUEST:
      return { ...state, loading: true };
    case ADD_CONTEXT_SUCCESS:
      return { ...state, contextSuccess: true, error: null, loading: false };
    case ADD_CONTEXT_FAILURE:
      console.debug('create matter failure:', state, action);
      return { ...state, error: action.payload, contextSuccess: false, loading: false };
    case REMOVE_FILE_REQUEST:
      return { ...state, loading: true };
    case REMOVE_FILE_SUCCESS:
      return { ...state, fileDeletion: true, error: null, loading: false };
    case REMOVE_FILE_FAILURE:
      console.debug('Delete file from matter failure:', state, action);
      return { ...state, error: action.payload, fileDeletion: false, loading: false };
    default:
      return state;
  }
}

module.exports = mattersReducer;
