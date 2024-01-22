const { FETCH_INQUIRIES_REQUEST, FETCH_INQUIRIES_SUCCESS, FETCH_INQUIRIES_FAILURE } = require('../actions/inquiriesActions');

const initialState = {
  inquiries: [],
  error: null,
  loading: false
};

function inquiriesReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_INQUIRIES_REQUEST:
      return { ...state, loading: true };
    case FETCH_INQUIRIES_SUCCESS:
      return { ...state, inquiries: action.payload, loading: false};
    case FETCH_INQUIRIES_FAILURE:
      console.debug('fetch inquiries failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = inquiriesReducer;
