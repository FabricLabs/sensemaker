const {
  SYNC_REDIS_QUEUE_REQUEST,
  SYNC_REDIS_QUEUE_SUCCESS,
  SYNC_REDIS_QUEUE_FAILURE,
  LAST_JOB_TAKEN_REQUEST,
  LAST_JOB_TAKEN_SUCCESS,
  LAST_JOB_TAKEN_FAILURE,
  LAST_JOB_COMPLETED_REQUEST,
  LAST_JOB_COMPLETED_SUCCESS,
  LAST_JOB_COMPLETED_FAILURE,
} = require('../actions/redisActions');

const initialState = {
  queue: [],
  lastJobCompleted: null,
  lastJobTaken: null,
  error: null,
  loading: false
};

function redisReducer(state = initialState, action) {
  switch (action.type) {

    case SYNC_REDIS_QUEUE_REQUEST:
      return { ...state, loading: true, error: null };
    case SYNC_REDIS_QUEUE_SUCCESS:
      return { ...state, loading: false, queue: action.payload };
    case SYNC_REDIS_QUEUE_FAILURE:
      return { ...state, loading: false, error: action.payload };


    case LAST_JOB_TAKEN_REQUEST:
      return { ...state, loading: true, error: null };
    case LAST_JOB_TAKEN_SUCCESS:
      return { ...state, loading: false, lastJobTaken: action.payload };
    case LAST_JOB_TAKEN_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case LAST_JOB_COMPLETED_REQUEST:
      return { ...state, loading: true, error: null };
    case LAST_JOB_COMPLETED_SUCCESS:
      return { ...state, loading: false, lastJobCompleted: action.payload };
    case LAST_JOB_COMPLETED_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      // console.warn('Unhandled action in redis reducer:', action);
      return state;
  }
}

module.exports = redisReducer;
