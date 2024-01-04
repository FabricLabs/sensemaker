const {
    FETCH_PERSON_REQUEST,
    FETCH_PERSON_SUCCESS,
    FETCH_PERSON_FAILURE,
    FETCH_PEOPLE_REQUEST,
    FETCH_PEOPLE_SUCCESS,
    FETCH_PEOPLE_FAILURE
  } = require('../actions/personActions');

  const initialState = {
    person: {},
    people: [],
    loading: false,
    error: null
  };

  function personReducer (state = initialState, action) {
    switch (action.type) {
      case FETCH_PERSON_REQUEST:
        return { ...state, loading: true, error: null };
      case FETCH_PERSON_SUCCESS:
        return { ...state, loading: false, person: action.payload };
      case FETCH_PERSON_FAILURE:
        return { ...state, loading: false, error: action.payload };
      case FETCH_PEOPLE_REQUEST:
        return { ...state, loading: true, error: null };
      case FETCH_PEOPLE_SUCCESS:
        return { ...state, loading: false, people: action.payload };
      case FETCH_PEOPLE_FAILURE:
        return { ...state, loading: false, error: action.payload };
      default:
        // console.warn('Unhandled action in person reducer:', action);
        return state;
    }
  }

  module.exports = personReducer;
