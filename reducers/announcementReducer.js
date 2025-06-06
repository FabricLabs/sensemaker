'use strict';

const {
  FETCH_ANNOUNCEMENTS_REQUEST,
  FETCH_ANNOUNCEMENTS_SUCCESS,
  FETCH_ANNOUNCEMENTS_FAILURE,
} = require('../actions/announcementActions');

const initialState = {
  announcements: [],
  loading: false,
  error: null
};

function announcementReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_ANNOUNCEMENTS_REQUEST:
      return { ...state, loading: true };
    case FETCH_ANNOUNCEMENTS_SUCCESS:
      return { 
        ...state, 
        announcements: action.payload,
        loading: false,
        error: null
      };
    case FETCH_ANNOUNCEMENTS_FAILURE:
      return { 
        ...state, 
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
}

module.exports = announcementReducer; 