const {
  FETCH_USER_REQUEST,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILURE,
  FETCH_USERS_REQUEST,
  FETCH_USERS_SUCCESS,
  FETCH_USERS_FAILURE,
  PASSWORD_RESET_REQUEST,
  PASSWORD_RESET_SUCCESS,
  PASSWORD_RESET_FAILURE,
} = require('../actions/usersActions');

const initialState = {
  users: [],
  current: {},
  loading: false,
  error: null,
  passwordReseted: false,
  currentEmail: null,
};

function usersReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_USER_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_USER_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_USER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_USERS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_USERS_SUCCESS:
      return { ...state, loading: false, users: action.payload };
    case FETCH_USERS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case PASSWORD_RESET_REQUEST:
      return { ...state, reseting: true, error: null, passwordReseted: false, currentEmail: action.payload };
    case PASSWORD_RESET_SUCCESS:
      return { ...state, reseting: false, error: null, passwordReseted: true, };
    case PASSWORD_RESET_FAILURE:
      return { ...state, reseting: false, error: action.payload, passwordReseted: false, };
    default:
      // console.warn('Unhandled action in users reducer:', action);
      return state;
  }
}

module.exports = usersReducer;
