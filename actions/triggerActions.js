'use strict';

// Action Types
const FETCH_TRIGGERS_REQUEST = 'FETCH_TRIGGERS_REQUEST';
const FETCH_TRIGGERS_SUCCESS = 'FETCH_TRIGGERS_SUCCESS';
const FETCH_TRIGGERS_FAILURE = 'FETCH_TRIGGERS_FAILURE';

const CREATE_TRIGGER_REQUEST = 'CREATE_TRIGGER_REQUEST';
const CREATE_TRIGGER_SUCCESS = 'CREATE_TRIGGER_SUCCESS';
const CREATE_TRIGGER_FAILURE = 'CREATE_TRIGGER_FAILURE';

const UPDATE_TRIGGER_REQUEST = 'UPDATE_TRIGGER_REQUEST';
const UPDATE_TRIGGER_SUCCESS = 'UPDATE_TRIGGER_SUCCESS';
const UPDATE_TRIGGER_FAILURE = 'UPDATE_TRIGGER_FAILURE';

// Action Creators
const fetchTriggersRequest = () => ({ type: FETCH_TRIGGERS_REQUEST });
const fetchTriggersSuccess = (triggers) => ({ type: FETCH_TRIGGERS_SUCCESS, payload: triggers });
const fetchTriggersFailure = (error) => ({ type: FETCH_TRIGGERS_FAILURE, payload: error });

const createTriggerRequest = () => ({ type: CREATE_TRIGGER_REQUEST });
const createTriggerSuccess = (trigger) => ({ type: CREATE_TRIGGER_SUCCESS, payload: trigger });
const createTriggerFailure = (error) => ({ type: CREATE_TRIGGER_FAILURE, payload: error });

const updateTriggerRequest = () => ({ type: UPDATE_TRIGGER_REQUEST });
const updateTriggerSuccess = (trigger) => ({ type: UPDATE_TRIGGER_SUCCESS, payload: trigger });
const updateTriggerFailure = (error) => ({ type: UPDATE_TRIGGER_FAILURE, payload: error });

// API Calls
const fetchTriggersFromAPI = async (token) => {
  const response = await fetch('/triggers', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch triggers');
  return response.json();
};

const createTriggerFromAPI = async (token, triggerData) => {
  const response = await fetch('/triggers', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(triggerData)
  });
  if (!response.ok) throw new Error('Failed to create trigger');
  return response.json();
};

const updateTriggerFromAPI = async (token, triggerId, triggerData) => {
  const response = await fetch(`/triggers/${triggerId}`, {
    method: 'PATCH',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(triggerData)
  });
  if (!response.ok) throw new Error('Failed to update trigger');
  return response.json();
};

// Thunk Action Creators
const fetchTriggers = () => {
  return async (dispatch, getState) => {
    dispatch(fetchTriggersRequest());
    const { token } = getState().auth;
    try {
      const triggers = await fetchTriggersFromAPI(token);
      dispatch(fetchTriggersSuccess(triggers));
    } catch (error) {
      dispatch(fetchTriggersFailure(error.message));
    }
  };
};

const createTrigger = (triggerData) => {
  return async (dispatch, getState) => {
    dispatch(createTriggerRequest());
    const { token } = getState().auth;
    try {
      const trigger = await createTriggerFromAPI(token, triggerData);
      dispatch(createTriggerSuccess(trigger));
    } catch (error) {
      dispatch(createTriggerFailure(error.message));
    }
  };
};

const updateTrigger = (triggerId, triggerData) => {
  return async (dispatch, getState) => {
    dispatch(updateTriggerRequest());
    const { token } = getState().auth;
    try {
      const trigger = await updateTriggerFromAPI(token, triggerId, triggerData);
      dispatch(updateTriggerSuccess(trigger));
    } catch (error) {
      dispatch(updateTriggerFailure(error.message));
    }
  };
};

module.exports = {
  FETCH_TRIGGERS_REQUEST,
  FETCH_TRIGGERS_SUCCESS,
  FETCH_TRIGGERS_FAILURE,
  CREATE_TRIGGER_REQUEST,
  CREATE_TRIGGER_SUCCESS,
  CREATE_TRIGGER_FAILURE,
  UPDATE_TRIGGER_REQUEST,
  UPDATE_TRIGGER_SUCCESS,
  UPDATE_TRIGGER_FAILURE,
  fetchTriggers,
  createTrigger,
  updateTrigger
};
