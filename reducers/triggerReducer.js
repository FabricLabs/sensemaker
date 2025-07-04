'use strict';

const {
  FETCH_TRIGGERS_REQUEST,
  FETCH_TRIGGERS_SUCCESS,
  FETCH_TRIGGERS_FAILURE,
  CREATE_TRIGGER_REQUEST,
  CREATE_TRIGGER_SUCCESS,
  CREATE_TRIGGER_FAILURE,
  UPDATE_TRIGGER_REQUEST,
  UPDATE_TRIGGER_SUCCESS,
  UPDATE_TRIGGER_FAILURE
} = require('../actions/triggerActions');

const initialState = {
  triggers: [],
  error: null,
  loading: false,
  creating: false,
  updating: false,
  createSuccess: false,
  updateSuccess: false
};

function triggerReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_TRIGGERS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_TRIGGERS_SUCCESS:
      return { ...state, triggers: action.payload, loading: false };
    case FETCH_TRIGGERS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case CREATE_TRIGGER_REQUEST:
      return { ...state, creating: true, error: null, createSuccess: false };
    case CREATE_TRIGGER_SUCCESS:
      return { 
        ...state, 
        triggers: [...state.triggers, action.payload],
        creating: false,
        createSuccess: true 
      };
    case CREATE_TRIGGER_FAILURE:
      return { ...state, error: action.payload, creating: false, createSuccess: false };
    case UPDATE_TRIGGER_REQUEST:
      return { ...state, updating: true, error: null, updateSuccess: false };
    case UPDATE_TRIGGER_SUCCESS:
      return {
        ...state,
        triggers: state.triggers.map(trigger => 
          trigger.id === action.payload.id ? action.payload : trigger
        ),
        updating: false,
        updateSuccess: true
      };
    case UPDATE_TRIGGER_FAILURE:
      return { ...state, error: action.payload, updating: false, updateSuccess: false };
    default:
      return state;
  }
}

module.exports = triggerReducer;