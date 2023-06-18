export const fetchConversations = () => async dispatch => {
  const response = await fetch('/api/conversations'); // Replace with your API endpoint
  const data = await response.json();
  
  dispatch({ type: 'FETCH_CONVERSATIONS', payload: data });
};
