const {
  FETCH_CASE_REQUEST,
  FETCH_CASE_SUCCESS,
  FETCH_CASE_FAILURE
} = require('../actions/bridgeActions');

const initialState = {
  status: 'INITIALIZED',
  current: {},
  loading: false,
  error: null
};

function bridgeReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_CASE_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CASE_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_CASE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in bridge reducer:', action);
      return state;
  }
}

module.exports = bridgeReducer;
