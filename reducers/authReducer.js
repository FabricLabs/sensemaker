const { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE } = require('../actions/authActions');
const { SIGN_CONTRACT_SUCCESS } = require('../actions/contractActions');

const initialState = {
  isAdmin: false,
  isAuthenticated: false,
  isCompliant: false,
  token: null,
  error: null
};

function authReducer (state = initialState, action) {
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
    default:
      return state;
  }
}

module.exports = authReducer;
