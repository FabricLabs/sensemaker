const {
  FETCH_HELP_CONVERSATIONS_REQUEST,
  FETCH_HELP_CONVERSATIONS_SUCCESS,
  FETCH_HELP_CONVERSATIONS_FAILURE,
  FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST,
  FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS,
  FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE,
  FETCH_HELP_MESSAGES_REQUEST,
  FETCH_HELP_MESSAGES_SUCCESS,
  FETCH_HELP_MESSAGES_FAILURE,
  FETCH_ADMIN_HELP_MESSAGES_REQUEST,
  FETCH_ADMIN_HELP_MESSAGES_SUCCESS,
  FETCH_ADMIN_HELP_MESSAGES_FAILURE,
  SEND_HELP_MESSAGE_REQUEST,
  SEND_HELP_MESSAGE_SUCCESS,
  SEND_HELP_MESSAGE_FAILURE,
} = require('../actions/helpActions');


const initialState = {
  conversations: [],
  admin_conversations: [],
  messages: [],
  admin_messages: [],
  error: null,
  loading: false,
  sending: false,
  sentSuccess: false,
  conversation_id: null,
  loadingMsgs: false,
  loadingMsgsAdmin: false,
};

function inquiriesReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_HELP_CONVERSATIONS_REQUEST:
      return { ...state, error: null, loading: true };
    case FETCH_HELP_CONVERSATIONS_SUCCESS:
      return { ...state, conversations: action.payload, loading: false };
    case FETCH_HELP_CONVERSATIONS_FAILURE:
      console.debug('fetch help conversations failure:', state, action);
      return { ...state,  conversations: [], error: action.payload, loading: false };
    case FETCH_ADMIN_HELP_CONVERSATIONS_REQUEST:
      return { ...state,error: null, loading: true };
    case FETCH_ADMIN_HELP_CONVERSATIONS_SUCCESS:
      return { ...state, admin_conversations: action.payload, loading: false };
    case FETCH_ADMIN_HELP_CONVERSATIONS_FAILURE:
      console.debug('fetch help admin conversations failure:', state, action);
      return { ...state,  admin_conversations: [], error: action.payload, loading: false };
    case FETCH_HELP_MESSAGES_REQUEST:
      return { ...state, error: null, loadingMsgs: true };
    case FETCH_HELP_MESSAGES_SUCCESS:
      return { ...state, messages: action.payload, loadingMsgs: false };
    case FETCH_HELP_MESSAGES_FAILURE:
      console.debug('fetch help messages failure:', state, action);
      return { ...state, error: action.payload, messages: [], loadingMsgs: false };
    case FETCH_ADMIN_HELP_MESSAGES_REQUEST:
      return { ...state, error: null, loadingMsgsAdmin: true };
    case FETCH_ADMIN_HELP_MESSAGES_SUCCESS:
      return { ...state, admin_messages: action.payload, loadingMsgsAdmin: false };
    case FETCH_ADMIN_HELP_MESSAGES_FAILURE:
      console.debug('fetch help messages failure:', state, action);
      return { ...state, error: action.payload, admin_messages: [], loadingMsgsAdmin: false };
    case SEND_HELP_MESSAGE_REQUEST:
      return { ...state, sentSuccess: false, error: null, sending: true };
    case SEND_HELP_MESSAGE_SUCCESS:
      return { ...state, conversation_id: action.payload, sentSuccess: true, sending: false };
    case SEND_HELP_MESSAGE_FAILURE:
      console.debug('send help message failure:', state, action);
      return { ...state, sentSuccess: false, error: action.payload, sending: false };
    default:
      return state;
  }
}

module.exports = inquiriesReducer;
