const {
  FETCH_JUDGE_REQUEST,
  FETCH_JUDGE_SUCCESS,
  FETCH_JUDGE_FAILURE,
  FETCH_JUDGES_REQUEST,
  FETCH_JUDGES_SUCCESS,
  FETCH_JUDGES_FAILURE
} = require('../actions/judgeActions');

const initialState = {
  judge: {},
  judges: [],
  current: {},
  loading: false,
  error: null
};

function judgeReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_JUDGE_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_JUDGE_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_JUDGE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_JUDGES_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_JUDGES_SUCCESS:
      return { ...state, loading: false, judges: action.payload };
    case FETCH_JUDGES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in judge reducer:', action);
      return state;
  }
}

module.exports = judgeReducer;
