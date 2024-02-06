const {
  FETCH_CONVERSATION_REQUEST,
  FETCH_CONVERSATION_SUCCESS,
  FETCH_CONVERSATION_FAILURE,
  FETCH_CONVERSATIONS_REQUEST,
  FETCH_CONVERSATIONS_SUCCESS,
  FETCH_CONVERSATIONS_FAILURE,
  FETCH_MATTER_CONVERSATIONS_REQUEST,
  FETCH_MATTER_CONVERSATIONS_SUCCESS,
  FETCH_MATTER_CONVERSATIONS_FAILURE,

} = require('../actions/conversationActions');

const initialState = {
  conversation: {},
  conversations: [],
  matterConversations: [],
  loading: false,
  error: null
};

function conversationReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_CONVERSATION_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CONVERSATION_SUCCESS:
      return { ...state, loading: false, conversation: action.payload };
    case FETCH_CONVERSATION_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_CONVERSATIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CONVERSATIONS_SUCCESS:
      return { ...state, loading: false, conversations: action.payload };
    case FETCH_CONVERSATIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_MATTER_CONVERSATIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_MATTER_CONVERSATIONS_SUCCESS:
      return { ...state, loading: false, matterConversations: action.payload };
    case FETCH_MATTER_CONVERSATIONS_FAILURE:
      return { ...state, loading: false, error: action.payload, matterConversations: [], };
    default:
      // console.warn('Unhandled action in conversation reducer:', action);
      return state;
  }
}

module.exports = conversationReducer;
