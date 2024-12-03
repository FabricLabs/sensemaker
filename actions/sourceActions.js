'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchSourcesFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/tasks', null, token);
}

// Action types
const FETCH_SOURCES_REQUEST = 'FETCH_SOURCES_REQUEST';
const FETCH_SOURCES_SUCCESS = 'FETCH_SOURCES_SUCCESS';
const FETCH_SOURCES_FAILURE = 'FETCH_SOURCES_FAILURE';

const FETCH_SOURCE_REQUEST = 'FETCH_SOURCE_REQUEST';
const FETCH_SOURCE_SUCCESS = 'FETCH_SOURCE_SUCCESS';
const FETCH_SOURCE_FAILURE = 'FETCH_SOURCE_FAILURE';

const CREATE_SOURCE_REQUEST = 'CREATE_SOURCE_REQUEST';
const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';
const CREATE_SOURCE_FAILURE = 'CREATE_SOURCE_FAILURE';

// Action creators
const fetchSourcesRequest = () => ({ type: FETCH_SOURCES_REQUEST, loading: true });
const fetchSourcesSuccess = (users) => ({ type: FETCH_SOURCES_SUCCESS, payload: users, loading: false });
const fetchSourcesFailure = (error) => ({ type: FETCH_SOURCES_FAILURE, payload: error, loading: false });

const fetchTaskRequest = () => ({ type: FETCH_SOURCE_REQUEST, loading: true });
const fetchTaskSuccess = (instance) => ({ type: FETCH_SOURCE_SUCCESS, payload: instance, loading: false });
const fetchTaskFailure = (error) => ({ type: FETCH_SOURCE_FAILURE, payload: error, loading: false });

const createTaskRequest = (email) => ({ type: CREATE_SOURCE_REQUEST, payload: email });
const createTaskSuccess = () => ({ type: CREATE_SOURCE_SUCCESS });
const createTaskFailure = (error) => ({ type: CREATE_SOURCE_FAILURE, payload: error });

// Thunk action creator
const fetchSources = () => {
  return async (dispatch, getState) => {
    dispatch(fetchSourcesRequest());
    const { token } = getState().auth;
    try {
      const users = await fetchSourcesFromAPI(token);
      dispatch(fetchSourcesSuccess(users));
    } catch (error) {
      dispatch(fetchSourcesFailure(error));
    }
  };
};

const fetchTask = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchTaskRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/tasks/${id}`, null, token);
      dispatch(fetchTaskSuccess(instance));
    } catch (error) {
      dispatch(fetchTaskFailure(error));
    }
  };
};

const createTask = (task) => {
  return async (dispatch, getState) => {
    dispatch(createTaskRequest(task));
    const { token } = getState().auth;
    try {
      // call for the fetch that generates the token for password reset
      const fetchPromise = fetch('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Could not create task.  Please try again.'));
        }, 60000);
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      //task with reset token sent
      dispatch(createTaskSuccess());
    } catch (error) {
      dispatch(createTaskFailure(error));
    }
  };
}

module.exports = {
  fetchTask,
  fetchSources,
  createTask,
  FETCH_SOURCE_REQUEST,
  FETCH_SOURCE_SUCCESS,
  FETCH_SOURCE_FAILURE,
  FETCH_SOURCES_REQUEST,
  FETCH_SOURCES_SUCCESS,
  FETCH_SOURCES_FAILURE,
  CREATE_SOURCE_REQUEST,
  CREATE_SOURCE_SUCCESS,
  CREATE_SOURCE_FAILURE,
};
