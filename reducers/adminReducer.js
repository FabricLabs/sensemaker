const {
  FETCH_ADMIN_STATS_REQUEST,
  FETCH_ADMIN_STATS_SUCCESS,
  FETCH_ADMIN_STATS_FAILURE,
  FETCH_SYNC_STATS_REQUEST,
  FETCH_SYNC_STATS_SUCCESS,
  FETCH_SYNC_STATS_FAILURE
} = require('../actions/adminActions');

const initialState = {
  error: null,
  loading: true
};

function adminReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_ADMIN_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_ADMIN_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false};
    case FETCH_ADMIN_STATS_FAILURE:
      console.debug('fetch admin stats failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    case FETCH_SYNC_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_SYNC_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false};
    case FETCH_SYNC_STATS_FAILURE:
      console.debug('fetch sync stats failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = adminReducer;
