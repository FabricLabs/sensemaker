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
  EDIT_TITLE_REQUEST,
  EDIT_TITLE_SUCCESS,
  EDIT_TITLE_FAILURE,

} = require('../actions/conversationActions');

const initialState = {
  conversation: {},
  conversations: [],
  matterConversations: [],
  loading: false,
  editing: false,
  error: null,
  titleEditSuccess: false,
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
    case EDIT_TITLE_REQUEST:
      return { ...state, editing: true, error: null };
    case EDIT_TITLE_SUCCESS:
      return { ...state, editing: false, titleEditSuccess: true,};
    case EDIT_TITLE_FAILURE:
      return { ...state, editing: false, error: action.payload, titleEditSuccess: false };
    default:
      // console.warn('Unhandled action in conversation reducer:', action);
      return state;
  }
}

module.exports = conversationReducer;
