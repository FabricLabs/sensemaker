const {
  FETCH_ADMIN_STATS_REQUEST,
  FETCH_ADMIN_STATS_SUCCESS,
  FETCH_ADMIN_STATS_FAILURE,
  FETCH_SYNC_STATS_REQUEST,
  FETCH_SYNC_STATS_SUCCESS,
  FETCH_SYNC_STATS_FAILURE,
  EDIT_USERNAME_REQUEST,
  EDIT_USERNAME_SUCCESS,
  EDIT_USERNAME_FAILURE,

} = require('../actions/adminActions');

const initialState = {
  error: null,
  loading: true,
  userEditSuccess: false,
};

function adminReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_ADMIN_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_ADMIN_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_ADMIN_STATS_FAILURE:
      console.debug('fetch admin stats failure:', state, action);

      return { ...state, error: action.payload, loading: false };
    case FETCH_SYNC_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_SYNC_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_SYNC_STATS_FAILURE:
      console.debug('fetch sync stats failure:', state, action);
      return { ...state, error: action.payload, loading: false };

    case EDIT_USERNAME_REQUEST:
      return { ...state, }; // reset state
    case EDIT_USERNAME_SUCCESS:
      return { ...state, ...action.payload, loading: false, userEditSuccess: true };
    case EDIT_USERNAME_FAILURE:
      console.debug('edit username failure:', state, action);
      return { ...state, error: action.payload, loading: false, userEditSuccess: false };
    default:
      return state;
  }
}

module.exports = adminReducer;
