const { FETCH_ADMIN_STATS_REQUEST, FETCH_ADMIN_STATS_SUCCESS, FETCH_ADMIN_STATS_FAILURE } = require('../actions/adminActions');

const initialState = {
  stats: null,
  error: null
};

function adminReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_ADMIN_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_ADMIN_STATS_SUCCESS:        
      return { ...state, stats: action.payload};    
    case FETCH_ADMIN_STATS_FAILURE:
      console.debug('fetch admin stats failure:', state, action);
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

module.exports = adminReducer;
