const {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  CHECK_USERNAME_AVAILABLE_REQUEST,
  CHECK_USERNAME_AVAILABLE_SUCCESS,
  CHECK_USERNAME_AVAILABLE_FAILURE,
  CHECK_EMAIL_AVAILABLE_REQUEST,
  CHECK_EMAIL_AVAILABLE_SUCCESS,
  CHECK_EMAIL_AVAILABLE_FAILURE,

} = require('../actions/authActions');

const { SIGN_CONTRACT_SUCCESS } = require('../actions/contractActions');


const initialState = {
  isAdmin: false,
  isAuthenticated: false,
  isCompliant: false,
  token: null,
  error: null,
  usernameAvailable: false,
  emailAvailable: false,
};

function authReducer(state = initialState, action) {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, isAuthenticated: false, token: null, error: null }; // reset state
    case LOGIN_SUCCESS:
      return { ...state, isAuthenticated: true, isAdmin: action.payload.isAdmin || false, isCompliant: action.payload.isCompliant || false, username: action.payload.username, email: action.payload.email, token: action.payload.token };
    case LOGIN_FAILURE:
      console.debug('login failure:', state, action);
      return { ...state, isAuthenticated: false, token: null, error: action.payload };
    case SIGN_CONTRACT_SUCCESS:
      return { ...state, isCompliant: true };

    //actions for checking if the username is available
    case CHECK_USERNAME_AVAILABLE_REQUEST:
      return { ...state, loading: true };
    case CHECK_USERNAME_AVAILABLE_SUCCESS:
      return { ...state, usernameAvailable: true, loading: false };
    case CHECK_USERNAME_AVAILABLE_FAILURE:
      return { ...state, error: action.payload, usernameAvailable: false, loading: false };

    //actions for checking if the email is not registered
    case CHECK_EMAIL_AVAILABLE_REQUEST:
      return { ...state, loading: true };
    case CHECK_EMAIL_AVAILABLE_SUCCESS:
      return { ...state, emailAvailable: true, loading: false };
    case CHECK_EMAIL_AVAILABLE_FAILURE:
      return { ...state, error: action.payload, emailAvailable: false, loading: false };

    default:
      return state;
  }
}

module.exports = authReducer;
