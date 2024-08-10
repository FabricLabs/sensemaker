const {
  SEND_FEEDBACK_REQUEST,
  SEND_FEEDBACK_SUCCESS,
  SEND_FEEDBACK_FAILURE,

} = require('../actions/feedbackActions');

const initialState = {
  loading: false,
  sentSuccesfull: false,
  error: null,
};

function feedbackReducer (state = initialState, action) {
  switch (action.type) {
    case SEND_FEEDBACK_REQUEST:
      return { ...state, loading: true, error: null };
    case SEND_FEEDBACK_SUCCESS:
      return { ...state, loading: false, sentSuccesfull: true, error: null };
    case SEND_FEEDBACK_FAILURE:
      return { ...state, loading: false, error: action.payload , sentSuccesfull: false};
    default:
      return state;
  }
}

module.exports = feedbackReducer;
