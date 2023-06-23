const { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE } = require('../actions/authActions');

const initialState = { isAuthenticated: false, token: null, error: null };

function authReducer (state = initialState, action) {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, isAuthenticated: false, token: null, error: null }; // reset state
    case LOGIN_SUCCESS:
      return { ...state, isAuthenticated: true, token: action.payload.token };
    case LOGIN_FAILURE:
      console.debug('login failure:', state, action);
      return { ...state, isAuthenticated: false, token: null, error: action.payload };
    default:
      return state;
  }
}

module.exports = authReducer;
