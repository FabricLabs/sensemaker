const {
  FETCH_INQUIRIES_REQUEST,
  FETCH_INQUIRIES_SUCCESS,
  FETCH_INQUIRIES_FAILURE,
  CREATE_INQUIRY_REQUEST,
  CREATE_INQUIRY_SUCCESS,
  CREATE_INQUIRY_FAILURE,
} = require('../actions/inquiriesActions');


const initialState = {
  inquiries: [],
  error: null,
  loading: false,
  creating: false,
  createdSuccess: false,
};

function inquiriesReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_INQUIRIES_REQUEST:
      return { ...state, loading: true };
    case FETCH_INQUIRIES_SUCCESS:
      return { ...state, inquiries: action.payload, loading: false };
    case FETCH_INQUIRIES_FAILURE:
      console.debug('fetch inquiries failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    case CREATE_INQUIRY_REQUEST:
      return { ...state, creating: true };
    case CREATE_INQUIRY_SUCCESS:
      return { ...state, createdSuccess: true, creating: false };
    case CREATE_INQUIRY_FAILURE:
      console.debug('fetch inquiries failure:', state, action);
      return { ...state, createdSuccess: false, error: action.payload, creating: false };
    default:
      return state;
  }
}

module.exports = inquiriesReducer;
