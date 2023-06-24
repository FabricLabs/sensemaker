const { CHAT_REQUEST, CHAT_SUCCESS, CHAT_FAILURE } = require('../actions/chatActions');

const initialState = {
  error: null,
  message: '',
  isMessageSent: false,
  isSending: false
};

function chatReducer (state = initialState, action) {
  switch (action.type) {
    case CHAT_REQUEST:
      return { 
        ...state, 
        message: '', 
        error: null,
        isSending: true, // Set isSending to true when a chat request is made
      };
    case CHAT_SUCCESS:
      console.debug('chat success:', state, action);
      return { 
        ...state, 
        message: action.payload, 
        isMessageSent: true,
        isSending: false, // Set isSending to false when chat request is successful
      };
    case CHAT_FAILURE:
      console.debug('chat failure:', state, action);
      return { 
        ...state, 
        error: action.payload, 
        isMessageSent: false,
        isSending: false, // Set isSending to false when chat request fails
      };
    default:
      return state;
  }
}

module.exports = chatReducer;
