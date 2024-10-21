'use strict';

// Actions
const {
  FETCH_CONTRACT_REQUEST,
  FETCH_CONTRACT_SUCCESS,
  FETCH_CONTRACT_FAILURE,
  SIGN_CONTRACT_REQUEST,
  SIGN_CONTRACT_SUCCESS,
  SIGN_CONTRACT_FAILURE,
  GET_CONTRACTS_REQUEST,
  GET_CONTRACTS_SUCCESS,
  GET_CONTRACTS_FAILURE
} = require('../actions/contractActions');

// State
const initialState = {
  error: null,
  contract: {},
  contracts: {},
  isCompliant: false
};

// Reducer
function contractReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_CONTRACT_REQUEST:
      return {
        ...state,
        contract: action.payload
      };
    case FETCH_CONTRACT_SUCCESS:
      return {
        ...state,
        contract: action.payload
      };
    case FETCH_CONTRACT_FAILURE:
      return {
        ...state,
        error: action.payload
      };
    case GET_CONTRACTS_SUCCESS:
      return {
        ...state,
        messages: action.payload.messages,
        isSending: false,
        loading: false
      };
    case SIGN_CONTRACT_SUCCESS:
      return {
        ...state,
        contract: action.payload,
        isCompliant: true
      };
    default:
      return state;
  }
}

module.exports = contractReducer;
