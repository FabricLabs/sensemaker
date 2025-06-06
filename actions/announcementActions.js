'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchAnnouncementsFromAPI () {
  const response = await fetch(`/announcements`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

// Action types
const FETCH_ANNOUNCEMENTS_REQUEST = 'FETCH_ANNOUNCEMENTS_REQUEST';
const FETCH_ANNOUNCEMENTS_SUCCESS = 'FETCH_ANNOUNCEMENTS_SUCCESS';
const FETCH_ANNOUNCEMENTS_FAILURE = 'FETCH_ANNOUNCEMENTS_FAILURE';

// Action creators
const fetchAnnouncementsRequest = () => ({ type: FETCH_ANNOUNCEMENTS_REQUEST });
const fetchAnnouncementsSuccess = (stats) => ({ type: FETCH_ANNOUNCEMENTS_SUCCESS, payload: stats });
const fetchAnnouncementsFailure = (error) => ({ type: FETCH_ANNOUNCEMENTS_FAILURE, payload: error });

// Thunk action creator
const fetchAnnouncements = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAnnouncementsRequest());
    // const { token } = getState().auth;
    try {
      const announcements = await fetchAnnouncementsFromAPI();
      dispatch(fetchAnnouncementsSuccess(announcements));
    } catch (error) {
      dispatch(fetchAnnouncementsFailure(error));
    }
  };
};

module.exports = {
  fetchAnnouncements,
  FETCH_ANNOUNCEMENTS_REQUEST,
  FETCH_ANNOUNCEMENTS_SUCCESS,
  FETCH_ANNOUNCEMENTS_FAILURE
};
