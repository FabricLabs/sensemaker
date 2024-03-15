const {
  SEARCH_GLOBAL_REQUEST,
  SEARCH_GLOBAL_SUCCESS,
  SEARCH_GLOBAL_FAILURE
} = require('../actions/searchActions');

const initialState = {
  result: {},
  searching: false,
  error: null,
};

function searchReducer (state = initialState, action) {
  switch (action.type) {
    case SEARCH_GLOBAL_REQUEST:
      return { ...state, searching: true, error: null };
    case SEARCH_GLOBAL_SUCCESS:
      return { ...state, searching: false, result: action.payload, error: null };
    case SEARCH_GLOBAL_FAILURE:
      return { ...state, searching: false, error: action.payload, result: {} }; 
    default:
      return state;
  }
}

module.exports = searchReducer;
