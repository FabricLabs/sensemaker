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
const EDIT_ANNOUNCEMENT_REQUEST = 'EDIT_ANNOUNCEMENT_REQUEST';
const EDIT_ANNOUNCEMENT_SUCCESS = 'EDIT_ANNOUNCEMENT_SUCCESS';
const EDIT_ANNOUNCEMENT_FAILURE = 'EDIT_ANNOUNCEMENT_FAILURE';

// Action creators
const fetchAnnouncementsRequest = () => ({ type: FETCH_ANNOUNCEMENTS_REQUEST });
const fetchAnnouncementsSuccess = (stats) => ({ type: FETCH_ANNOUNCEMENTS_SUCCESS, payload: stats });
const fetchAnnouncementsFailure = (error) => ({ type: FETCH_ANNOUNCEMENTS_FAILURE, payload: error });
const editAnnouncementRequest = () => ({ type: EDIT_ANNOUNCEMENT_REQUEST });
const editAnnouncementSuccess = () => ({ type: EDIT_ANNOUNCEMENT_SUCCESS });
const editAnnouncementFailure = (error) => ({ type: EDIT_ANNOUNCEMENT_FAILURE, payload: error });

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

const editAnnouncement = (id, changes) => {
  return async (dispatch, getState) => {
    dispatch(editAnnouncementRequest());
    try {
      const { token } = getState().auth;
      const response = await fetch(`/announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(changes)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to edit announcement: ${response.status} ${response.statusText}`);
      }

      await response.json(); // Ensure we can parse the response

      dispatch(editAnnouncementSuccess());
      // Refresh the announcements list
      dispatch(fetchAnnouncements());
    } catch (error) {
      console.error('Error editing announcement:', error);
      dispatch(editAnnouncementFailure(error.message || 'Failed to edit announcement'));
    }
  };
};

module.exports = {
  fetchAnnouncements,
  editAnnouncement,
  FETCH_ANNOUNCEMENTS_REQUEST,
  FETCH_ANNOUNCEMENTS_SUCCESS,
  FETCH_ANNOUNCEMENTS_FAILURE,
  EDIT_ANNOUNCEMENT_REQUEST,
  EDIT_ANNOUNCEMENT_SUCCESS,
  EDIT_ANNOUNCEMENT_FAILURE
};
