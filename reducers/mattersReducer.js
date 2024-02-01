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
} = require('../actions/mattersActions');

const initialState = {
  current: {},
  error: null,
  loading: false,
  sending: false,
  matters: null,
  creationSuccess: false,
  idCreated: null,
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
    default:
      return state;
  }
}

module.exports = mattersReducer;
