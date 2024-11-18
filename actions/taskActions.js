'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchTasksFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/tasks', null, token);
}

// Action types
const FETCH_TASKS_REQUEST = 'FETCH_TASKS_REQUEST';
const FETCH_TASKS_SUCCESS = 'FETCH_TASKS_SUCCESS';
const FETCH_TASKS_FAILURE = 'FETCH_TASKS_FAILURE';

const FETCH_TASK_REQUEST = 'FETCH_TASK_REQUEST';
const FETCH_TASK_SUCCESS = 'FETCH_TASK_SUCCESS';
const FETCH_TASK_FAILURE = 'FETCH_TASK_FAILURE';

const CREATE_TASK_REQUEST = 'CREATE_TASK_REQUEST';
const CREATE_TASK_SUCCESS = 'CREATE_TASK_SUCCESS';
const CREATE_TASK_FAILURE = 'CREATE_TASK_FAILURE';

// Action creators
const fetchTasksRequest = () => ({ type: FETCH_TASKS_REQUEST, loading: true });
const fetchTasksSuccess = (users) => ({ type: FETCH_TASKS_SUCCESS, payload: users, loading: false });
const fetchTasksFailure = (error) => ({ type: FETCH_TASKS_FAILURE, payload: error, loading: false });

const fetchTaskRequest = () => ({ type: FETCH_TASK_REQUEST, loading: true });
const fetchTaskSuccess = (instance) => ({ type: FETCH_TASK_SUCCESS, payload: instance, loading: false });
const fetchTaskFailure = (error) => ({ type: FETCH_TASK_FAILURE, payload: error, loading: false });

const createTaskRequest = (email) => ({ type: CREATE_TASK_REQUEST, payload: email });
const createTaskSuccess = () => ({ type: CREATE_TASK_SUCCESS });
const createTaskFailure = (error) => ({ type: CREATE_TASK_FAILURE, payload: error });

// Thunk action creator
const fetchTasks = () => {
  return async (dispatch, getState) => {
    dispatch(fetchTasksRequest());
    const { token } = getState().auth;
    try {
      const users = await fetchTasksFromAPI(token);
      dispatch(fetchTasksSuccess(users));
    } catch (error) {
      dispatch(fetchTasksFailure(error));
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
  fetchTasks,
  createTask,
  FETCH_TASK_REQUEST,
  FETCH_TASK_SUCCESS,
  FETCH_TASK_FAILURE,
  FETCH_TASKS_REQUEST,
  FETCH_TASKS_SUCCESS,
  FETCH_TASKS_FAILURE,
  CREATE_TASK_REQUEST,
  CREATE_TASK_SUCCESS,
  CREATE_TASK_FAILURE,
};