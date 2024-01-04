const {
  FETCH_VOLUME_REQUEST,
  FETCH_VOLUME_SUCCESS,
  FETCH_VOLUME_FAILURE,
  FETCH_VOLUMES_REQUEST,
  FETCH_VOLUMES_SUCCESS,
  FETCH_VOLUMES_FAILURE
} = require('../actions/volumeActions');

const initialState = {
  volume: {},
  volumes: [],
  current: {},
  loading: false,
  error: null
};

function volumeReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_VOLUME_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_VOLUME_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_VOLUME_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_VOLUMES_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_VOLUMES_SUCCESS:
      return { ...state, loading: false, volumes: action.payload };
    case FETCH_VOLUMES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      // console.warn('Unhandled action in volume reducer:', action);
      return state;
  }
}

module.exports = volumeReducer;
