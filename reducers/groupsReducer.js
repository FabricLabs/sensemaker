const {
  FETCH_GROUP_REQUEST,
  FETCH_GROUP_SUCCESS,
  FETCH_GROUP_FAILURE,
  FETCH_GROUPS_REQUEST,
  FETCH_GROUPS_SUCCESS,
  FETCH_GROUPS_FAILURE,
} = require('../actions/groupActions');

const initialState = {
  groups: [],
  current: {},
  loading: false,
  error: null
};

function accountsReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_GROUP_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_GROUP_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_GROUP_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_GROUPS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_GROUPS_SUCCESS:
      return { ...state, loading: false, groups: action.payload };
    case FETCH_GROUPS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in groups reducer:', action);
      return state;
  }
}

module.exports = accountsReducer;
