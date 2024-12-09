'use strict';

const fetch = require('cross-fetch');
const { fetchFromAPI } = require('./apiActions');

async function fetchGroupsFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/groups', null, token);
}

// Action types
const CREATE_GROUP_REQUEST = 'CREATE_GROUP_REQUEST';
const CREATE_GROUP_SUCCESS = 'CREATE_GROUP_SUCCESS';
const CREATE_GROUP_FAILURE = 'CREATE_GROUP_FAILURE';

const FETCH_GROUPS_REQUEST = 'FETCH_GROUPS_REQUEST';
const FETCH_GROUPS_SUCCESS = 'FETCH_GROUPS_SUCCESS';
const FETCH_GROUPS_FAILURE = 'FETCH_GROUPS_FAILURE';

const FETCH_GROUP_REQUEST = 'FETCH_GROUP_REQUEST';
const FETCH_GROUP_SUCCESS = 'FETCH_GROUP_SUCCESS';
const FETCH_GROUP_FAILURE = 'FETCH_GROUP_FAILURE';

// Action creators
const createGroupRequest = () => ({ type: CREATE_GROUP_REQUEST, loading: true });
const createGroupSuccess = (groups) => ({ type: CREATE_GROUP_SUCCESS, payload: groups, loading: false });
const createGroupFailure = (error) => ({ type: CREATE_GROUP_FAILURE, payload: error, loading: false });

const fetchGroupsRequest = () => ({ type: FETCH_GROUPS_REQUEST, loading: true });
const fetchGroupsSuccess = (groups) => ({ type: FETCH_GROUPS_SUCCESS, payload: groups, loading: false });
const fetchGroupsFailure = (error) => ({ type: FETCH_GROUPS_FAILURE, payload: error, loading: false });

const fetchGroupRequest = () => ({ type: FETCH_GROUP_REQUEST, loading: true });
const fetchGroupSuccess = (instance) => ({ type: FETCH_GROUP_SUCCESS, payload: instance, loading: false });
const fetchGroupFailure = (error) => ({ type: FETCH_GROUP_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchGroups = () => {
  return async (dispatch, getState) => {
    dispatch(fetchGroupsRequest());
    const { token } = getState().auth;
    try {
      const groups = await fetchGroupsFromAPI(token);
      dispatch(fetchGroupsSuccess(groups));
    } catch (error) {
      dispatch(fetchGroupsFailure(error));
    }
  };
};

const fetchGroup = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchGroupRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/groups/${id}`, null, token);
      dispatch(fetchGroupSuccess(instance));
    } catch (error) {
      dispatch(fetchGroupFailure(error));
    }
  };
};

const createGroup = (group) => {
  return async (dispatch, getState) => {
    dispatch(createGroupRequest());
    const { token } = getState().auth;
    try {
      const newGroup = await fetch('/groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(group)
      });
      dispatch(createGroupSuccess(newGroup));
    } catch (error) {
      dispatch(createGroupFailure(error));
    }
  };
}

module.exports = {
  fetchGroup,
  fetchGroups,
  createGroup,
  CREATE_GROUP_REQUEST,
  CREATE_GROUP_SUCCESS,
  CREATE_GROUP_FAILURE,
  FETCH_GROUP_REQUEST,
  FETCH_GROUP_SUCCESS,
  FETCH_GROUP_FAILURE,
  FETCH_GROUPS_REQUEST,
  FETCH_GROUPS_SUCCESS,
  FETCH_GROUPS_FAILURE
};
