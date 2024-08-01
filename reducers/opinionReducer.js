const {
  FETCH_OPINION_REQUEST,
  FETCH_OPINION_SUCCESS,
  FETCH_OPINION_FAILURE,
  FETCH_OPINIONS_REQUEST,
  FETCH_OPINIONS_SUCCESS,
  FETCH_OPINIONS_FAILURE
} = require('../actions/opinionActions');

const initialState = {
  opinion: {},
  opinions: [],
  current: {},
  loading: false,
  error: null
};

function opinionReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_OPINION_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_OPINION_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_OPINION_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_OPINIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_OPINIONS_SUCCESS:
      return { ...state, loading: false, opinions: action.payload };
    case FETCH_OPINIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in opinion reducer:', action);
      return state;
  }
}

module.exports = opinionReducer;
