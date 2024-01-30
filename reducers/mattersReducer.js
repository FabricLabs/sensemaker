const {
  FETCH_MATTERS_REQUEST,
  FETCH_MATTERS_SUCCESS,
  FETCH_MATTERS_FAILURE,
} = require('../actions/mattersActions');


const initialState = {
  current: {},
  error: null,
  loading: false,
  sending: false,
  matters: null
};

function mattersReducer(state = initialState, action) {
  switch (action.type) {
      //actions to fetch a single invitation (not ready yet)
      case FETCH_MATTERS_REQUEST:
          return { ...state, loading: true };
      case FETCH_MATTERS_SUCCESS:
          return { ...state, matters: action.payload, loading: false };
      case FETCH_MATTERS_FAILURE:
          console.debug('fetch matters failure:', state, action);
          return { ...state, error: action.payload, loading: false };
      default:
          return state;
  }
}

module.exports = mattersReducer;
