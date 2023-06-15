const redux = require('redux');

const initialState = {
  isAuthenticated: false
};

function rootReducer (state = initialState, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true };
    default:
      return state;
  }
}

module.exports = redux.createStore(rootReducer);
