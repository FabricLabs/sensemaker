const {
  FETCH_COURT_REQUEST,
  FETCH_COURT_SUCCESS,
  FETCH_COURT_FAILURE,
  FETCH_COURT_BY_ID_REQUEST,
  FETCH_COURT_BY_ID_SUCCESS,
  FETCH_COURT_BY_ID_FAILURE,
  FETCH_COURTS_REQUEST,
  FETCH_COURTS_SUCCESS,
  FETCH_COURTS_FAILURE,
  SEARCH_COURT_REQUEST,
  SEARCH_COURT_SUCCESS,
  SEARCH_COURT_FAILURE,
} = require('../actions/courtActions');

const initialState = {
  courts: [],
  current: {},
  loading: false,
  error: null,
  results: [],
};

function courtReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_COURT_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_COURT_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_COURT_FAILURE:
      return { ...state, loading: false, error: action.payload, current: {}, };
    case FETCH_COURT_BY_ID_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_COURT_BY_ID_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_COURT_BY_ID_FAILURE:
      return { ...state, loading: false, error: action.payload, current: {}, };
    case FETCH_COURTS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_COURTS_SUCCESS:
      return { ...state, loading: false, courts: action.payload };
    case FETCH_COURTS_FAILURE:
      return { ...state, loading: false, error: action.payload, courts: [] };
    case SEARCH_COURT_REQUEST:
      return { ...state, loading: true, error: null };
    case SEARCH_COURT_SUCCESS:
      return { ...state, loading: false, results: action.payload };
    case SEARCH_COURT_FAILURE:
      return { ...state, loading: false, error: action.payload, results: [] };

    default:
      // console.warn('Unhandled action in court reducer:', action);
      return state;
  }
}

module.exports = courtReducer;
