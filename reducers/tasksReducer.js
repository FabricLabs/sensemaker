'use strict';

const {
  FETCH_TASKS_REQUEST,
  FETCH_TASKS_SUCCESS,
  FETCH_TASKS_FAILURE,
  CREATE_TASK_REQUEST,
  CREATE_TASK_SUCCESS,
  CREATE_TASK_FAILURE,
  UPDATE_TASK_REQUEST,
  UPDATE_TASK_SUCCESS,
  UPDATE_TASK_FAILURE
} = require('../actions/taskActions');

const initialState = {
  tasks: [],
  error: null,
  loading: false,
  creating: false,
  createdSuccess: false,
};

function tasksReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_TASKS_REQUEST:
      return { ...state, loading: true };
    case FETCH_TASKS_SUCCESS:
      return { ...state, tasks: action.payload, loading: false };
    case FETCH_TASKS_FAILURE:
      console.debug('fetch tasks failure:', state, action);
      return { ...state, error: action.payload, loading: false };
    case CREATE_TASK_REQUEST:
      return { ...state, creating: true };
    case CREATE_TASK_SUCCESS:
      return { ...state, createdSuccess: true, creating: false };
    case CREATE_TASK_FAILURE:
      console.debug('fetch tasks failure:', state, action);
      return { ...state, createdSuccess: false, error: action.payload, creating: false };
    case UPDATE_TASK_REQUEST:
      return { ...state, creating: true };
    case UPDATE_TASK_SUCCESS:
      return { ...state, createdSuccess: true, creating: false };
    case UPDATE_TASK_FAILURE:
      return { ...state, createdSuccess: false, error: action.payload, creating: false };
    default:
      return state;
  }
}

module.exports = tasksReducer;
