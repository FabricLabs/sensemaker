const {
  FETCH_JURISDICTION_REQUEST,
  FETCH_JURISDICTION_SUCCESS,
  FETCH_JURISDICTION_FAILURE,
  FETCH_JURISDICTIONS_REQUEST,
  FETCH_JURISDICTIONS_SUCCESS,
  FETCH_JURISDICTIONS_FAILURE
} = require('../actions/jurisdictionsActions');

const initialState = {
  current: {},
  jurisdictions: [],
  loading: false,
  error: null
};

function jurisdictionsReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_JURISDICTION_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_JURISDICTION_SUCCESS:
      return { ...state, loading: false, current: action.payload, error: null };
    case FETCH_JURISDICTION_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_JURISDICTIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_JURISDICTIONS_SUCCESS:
      return { ...state, loading: false, jurisdictions: action.payload, error: null };
    case FETCH_JURISDICTIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in jurisdiction reducer:', action);
      return state;
  }
}

module.exports = jurisdictionsReducer;
