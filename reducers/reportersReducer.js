const {
  FETCH_REPORTER_REQUEST,
  FETCH_REPORTER_SUCCESS,
  FETCH_REPORTER_FAILURE,
  FETCH_REPORTERS_REQUEST,
  FETCH_REPORTERS_SUCCESS,
  FETCH_REPORTERS_FAILURE,
  SEARCH_REPORTER_REQUEST,
  SEARCH_REPORTER_SUCCESS,
  SEARCH_REPORTER_FAILURE,
} = require('../actions/reportersActions');

const initialState = {
  current: {},
  reporters: [],
  loading: false,
  error: null,
  results: [],
};

function reportersReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_REPORTER_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_REPORTER_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_REPORTER_FAILURE:
      return { ...state, loading: false, error: action.payload, current: {} };
    case FETCH_REPORTERS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_REPORTERS_SUCCESS:
      return { ...state, loading: false, reporters: action.payload };
    case FETCH_REPORTERS_FAILURE:
      return { ...state, loading: false, error: action.payload, reporters: [], };
    case SEARCH_REPORTER_REQUEST:
      return { ...state, loading: true, error: null };
    case SEARCH_REPORTER_SUCCESS:
      return { ...state, loading: false, results: action.payload };
    case SEARCH_REPORTER_FAILURE:
      return { ...state, loading: false, error: action.payload, results: [] };
    default:
      return state;
  }
}

module.exports = reportersReducer;
