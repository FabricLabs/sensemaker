const {
  BRIDGE_SYNC_REQUEST,
  BRIDGE_SYNC_SUCCESS,
  BRIDGE_SYNC_FAILURE
} = require('../actions/bridgeActions');

const initialState = {
  status: 'INITIALIZED',
  current: {},
  loading: false,
  error: null
};

function bridgeReducer (state = initialState, action) {
  switch (action.type) {
    case BRIDGE_SYNC_REQUEST:
      return { ...state, loading: true, error: null };
    case BRIDGE_SYNC_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case BRIDGE_SYNC_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in bridge reducer:', action);
      return state;
  }
}

module.exports = bridgeReducer;
