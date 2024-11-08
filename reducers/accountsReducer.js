const {
  FETCH_ACCOUNT_REQUEST,
  FETCH_ACCOUNT_SUCCESS,
  FETCH_ACCOUNT_FAILURE,
  FETCH_ACCOUNTS_REQUEST,
  FETCH_ACCOUNTS_SUCCESS,
  FETCH_ACCOUNTS_FAILURE,
  PASSWORD_RESET_REQUEST,
  PASSWORD_RESET_SUCCESS,
  PASSWORD_RESET_FAILURE,
} = require('../actions/accountActions');

const initialState = {
  users: [],
  current: {},
  loading: false,
  error: null,
  passwordReseted: false,
  currentEmail: null,
};

function accountsReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_ACCOUNT_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_ACCOUNT_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_ACCOUNT_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_ACCOUNTS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_ACCOUNTS_SUCCESS:
      return { ...state, loading: false, users: action.payload };
    case FETCH_ACCOUNTS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case PASSWORD_RESET_REQUEST:
      return { ...state, reseting: true, error: null, passwordReseted: false, currentEmail: action.payload };
    case PASSWORD_RESET_SUCCESS:
      return { ...state, reseting: false, error: null, passwordReseted: true, };
    case PASSWORD_RESET_FAILURE:
      return { ...state, reseting: false, error: action.payload, passwordReseted: false, };
    default:
      // console.warn('Unhandled action in accounts reducer:', action);
      return state;
  }
}

module.exports = accountsReducer;
