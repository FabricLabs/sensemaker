const {
  FETCH_CONVERSATIONS_REQUEST,
  FETCH_CONVERSATIONS_SUCCESS,
  FETCH_CONVERSATIONS_FAILURE
} = require('../actions/conversationActions');

const initialState = {
  conversations: [],
  loading: false,
  error: null
};

function conversationReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_CONVERSATIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CONVERSATIONS_SUCCESS:
      return { ...state, loading: false, conversations: action.payload };
    case FETCH_CONVERSATIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      console.warn('Unhandled action in reducer:', action);
      return state;
  }
}

module.exports = conversationReducer;
