'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchUsersFromAPI(token) {
  // TODO: pagination
  return fetchFromAPI('/users', null, token);
}

// Action types
const FETCH_USERS_REQUEST = 'FETCH_USERS_REQUEST';
const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS';
const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE';
const FETCH_USER_REQUEST = 'FETCH_USER_REQUEST';
const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
const FETCH_USER_FAILURE = 'FETCH_USER_FAILURE';

// Action creators
const fetchUsersRequest = () => ({ type: FETCH_USERS_REQUEST, loading: true });
const fetchUsersSuccess = (users) => ({ type: FETCH_USERS_SUCCESS, payload: users, loading: false });
const fetchUsersFailure = (error) => ({ type: FETCH_USERS_FAILURE, payload: error, loading: false });
const fetchUserRequest = () => ({ type: FETCH_USER_REQUEST, loading: true });
const fetchUserSuccess = (instance) => ({ type: FETCH_USER_SUCCESS, payload: instance, loading: false });
const fetchUserFailure = (error) => ({ type: FETCH_USER_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchUsers = () => {
  return async (dispatch, getState) => {
    dispatch(fetchUsersRequest());
    const { token } = getState().auth;
    try {
      const users = await fetchUsersFromAPI(token);
      dispatch(fetchUsersSuccess(users));
    } catch (error) {
      dispatch(fetchUsersFailure(error));
    }
  };
};

const fetchUser = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchUserRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/users/${id}`, null, token);
      dispatch(fetchUserSuccess(instance));
    } catch (error) {
      dispatch(fetchUserFailure(error));
    }
  };
};

module.exports = {
  fetchUser,
  fetchUsers,
  FETCH_USER_REQUEST,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILURE,
  FETCH_USERS_REQUEST,
  FETCH_USERS_SUCCESS,
  FETCH_USERS_FAILURE
};
