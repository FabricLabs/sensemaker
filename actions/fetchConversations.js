// API function
async function fetchFromAPI (token) {
  const response = await fetch('/conversations', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  return await response.json();
}

// Action types
const FETCH_CONVERSATIONS_REQUEST = 'FETCH_CONVERSATIONS_REQUEST';
const FETCH_CONVERSATIONS_SUCCESS = 'FETCH_CONVERSATIONS_SUCCESS';
const FETCH_CONVERSATIONS_FAILURE = 'FETCH_CONVERSATIONS_FAILURE';

// Action creators
const fetchConversationsRequest = () => ({ type: FETCH_CONVERSATIONS_REQUEST });
const fetchConversationsSuccess = (conversations) => ({ type: FETCH_CONVERSATIONS_SUCCESS, payload: conversations });
const fetchConversationsFailure = (error) => ({ type: FETCH_CONVERSATIONS_FAILURE, payload: error });

// Thunk action creator
const fetchConversations = () => {
  return async (dispatch, getState) => {
    dispatch(fetchConversationsRequest());
    const { token } = getState().auth;
    try {
      const conversations = await fetchFromAPI(token);
      dispatch(fetchConversationsSuccess(conversations));
    } catch (error) {
      dispatch(fetchConversationsFailure(error));
    }
  };
};

module.exports = {
  fetchConversations,
  FETCH_CONVERSATIONS_REQUEST,
  FETCH_CONVERSATIONS_SUCCESS,
  FETCH_CONVERSATIONS_FAILURE
};
