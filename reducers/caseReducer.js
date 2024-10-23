const {
  FETCH_CASE_REQUEST,
  FETCH_CASE_SUCCESS,
  FETCH_CASE_FAILURE,
  FETCH_CASES_REQUEST,
  FETCH_CASES_SUCCESS,
  FETCH_CASES_FAILURE,
  SEARCH_CASE_REQUEST,
  SEARCH_CASE_SUCCESS,
  SEARCH_CASE_FAILURE
} = require('../actions/caseActions');

const initialState = {
  case: {},
  cases: [],
  current: {},
  loading: false,
  error: null,
  results: [],
};

function caseReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_CASE_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CASE_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_CASE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_CASES_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CASES_SUCCESS:
      return { ...state, loading: false, cases: action.payload };
    case FETCH_CASES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case SEARCH_CASE_REQUEST:
      return { ...state, loading: true, error: null, results: [], };
    case SEARCH_CASE_SUCCESS:
      return { ...state, loading: false, results: action.payload, error: null };
    case SEARCH_CASE_FAILURE:
      return { ...state, loading: false, error: action.payload, results: [] };
    default:
      // console.warn('Unhandled action in case reducer:', action);
      return state;
  }
}

module.exports = caseReducer;