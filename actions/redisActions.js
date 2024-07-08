'use strict';

const { fetchFromAPI } = require('./apiActions');

async function syncQueueFromAPI(token) {
  return fetchFromAPI('/redis/queue', null, token);
}

// Action types
const SYNC_REDIS_QUEUE_REQUEST = 'SYNC_REDIS_QUEUE_REQUEST';
const SYNC_REDIS_QUEUE_SUCCESS = 'SYNC_REDIS_QUEUE_SUCCESS';
const SYNC_REDIS_QUEUE_FAILURE = 'SYNC_REDIS_QUEUE_FAILURE';

const LAST_JOB_TAKEN_REQUEST = 'LAST_JOB_TAKEN_REQUEST';
const LAST_JOB_TAKEN_SUCCESS = 'LAST_JOB_TAKEN_SUCCESS';
const LAST_JOB_TAKEN_FAILURE = 'LAST_JOB_TAKEN_FAILURE';

const LAST_JOB_COMPLETED_REQUEST = 'LAST_JOB_COMPLETED_REQUEST';
const LAST_JOB_COMPLETED_SUCCESS = 'LAST_JOB_COMPLETED_SUCCESS';
const LAST_JOB_COMPLETED_FAILURE = 'LAST_JOB_COMPLETED_FAILURE';

const CLEAR_QUEUE_REQUEST = 'CLEAR_QUEUE_REQUEST';
const CLEAR_QUEUE_SUCCESS = 'CLEAR_QUEUE_SUCCESS';
const CLEAR_QUEUE_FAILURE = 'CLEAR_QUEUE_FAILURE';

// Action creators
const syncQueueRequest = () => ({ type: SYNC_REDIS_QUEUE_REQUEST, loading: true });
const syncQueueSuccess = (jobs) => ({ type: SYNC_REDIS_QUEUE_SUCCESS, payload: jobs, loading: false });
const syncQueueFailure = (error) => ({ type: SYNC_REDIS_QUEUE_FAILURE, payload: error, loading: false });

const lastJobTakenRequest = () => ({ type: LAST_JOB_TAKEN_REQUEST, loading: true });
const lastJobTakenSuccess = (job) => ({ type: LAST_JOB_TAKEN_SUCCESS, payload: job });
const lastJobTakenFailure = (error) => ({ type: LAST_JOB_TAKEN_FAILURE, payload: error });

const lastJobCompletedRequest = () => ({ type: LAST_JOB_COMPLETED_REQUEST, loading: true });
const lastJobCompletedSuccess = (job) => ({ type: LAST_JOB_COMPLETED_SUCCESS, payload: job });
const lastJobCompletedFailure = (error) => ({ type: LAST_JOB_COMPLETED_FAILURE, payload: error });

const clearQueueRequest = () => ({ type: CLEAR_QUEUE_REQUEST, loading: true });
const clearQueueSuccess = (data) => ({ type: CLEAR_QUEUE_SUCCESS, payload: data });
const clearQueueFailure = (error) => ({ type: CLEAR_QUEUE_FAILURE, payload: error });

// Thunk action creator
const syncRedisQueue = () => {
  return async (dispatch, getState) => {
    dispatch(syncQueueRequest());
    const { token } = getState().auth;
    try {
      const jobs = await syncQueueFromAPI(token);
      dispatch(syncQueueSuccess(jobs));
    } catch (error) {
      dispatch(syncQueueFailure(error));
    }
  };
};

const lastJobTaken = (job) => {
  return async (dispatch) => {
    dispatch(lastJobTakenRequest());
    try {
      dispatch(lastJobTakenSuccess(job));
    } catch (error) {
      dispatch(lastJobTakenFailure(error));
    }
  };
};

const lastJobCompleted = (job) => {
  return async (dispatch) => {
    dispatch(lastJobCompletedRequest());
    try {
      dispatch(lastJobCompletedSuccess(job));
    } catch (error) {
      dispatch(lastJobCompletedFailure(error));
    }
  };
};

const clearQueue = () => {
  return async (dispatch,getState) => {
    dispatch(clearQueueRequest());
    const { token } = getState().auth;
    try {
        const response = await fetch(`/redis/queue`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Server error');
        }
        const data = await response.json();
      dispatch(clearQueueSuccess(data));
    } catch (error) {
      dispatch(clearQueueFailure(error));
    }
  };
};

module.exports = {
  syncRedisQueue,
  lastJobTaken,
  lastJobCompleted,
  clearQueue,
  SYNC_REDIS_QUEUE_REQUEST,
  SYNC_REDIS_QUEUE_SUCCESS,
  SYNC_REDIS_QUEUE_FAILURE,
  LAST_JOB_TAKEN_REQUEST,
  LAST_JOB_TAKEN_SUCCESS,
  LAST_JOB_TAKEN_FAILURE,
  LAST_JOB_COMPLETED_REQUEST,
  LAST_JOB_COMPLETED_SUCCESS,
  LAST_JOB_COMPLETED_FAILURE,
};
