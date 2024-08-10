'use strict';

// Dependencies
const fetch = require('cross-fetch');

// API Actions
const {
  fetchFromAPI,
  patchAPI
} = require('./apiActions');

// Action Types
const FETCH_CONTRACT_REQUEST = 'FETCH_CONTRACT_REQUEST';
const FETCH_CONTRACT_SUCCESS = 'FETCH_CONTRACT_SUCCESS';
const FETCH_CONTRACT_FAILURE = 'FETCH_CONTRACT_FAILURE';
const SIGN_CONTRACT_REQUEST = 'SIGN_CONTRACT_REQUEST';
const SIGN_CONTRACT_SUCCESS = 'SIGN_CONTRACT_SUCCESS';
const SIGN_CONTRACT_FAILURE = 'SIGN_CONTRACT_FAILURE';
const GET_CONTRACTS_REQUEST = 'GET_CONTRACTS_REQUEST';
const GET_CONTRACTS_SUCCESS = 'GET_CONTRACTS_SUCCESS';
const GET_CONTRACTS_FAILURE = 'GET_CONTRACTS_FAILURE';

// Sync Action Creators
const fetchContractRequest = () => ({ type: FETCH_CONTRACT_REQUEST });
const fetchContractSuccess = (contract) => ({ type: FETCH_CONTRACT_SUCCESS, payload: contract });
const fetchContractFailure = (error) => ({ type: FETCH_CONTRACT_FAILURE, payload: error });
const getContractsRequest = () => ({ type: GET_CONTRACTS_REQUEST, isSending: true });
const getContractsSuccess = (contracts) => ({ type: GET_CONTRACTS_SUCCESS, payload: { contracts }, isSending: false });
const getContractsFailure = (error) => ({ type: GET_CONTRACTS_FAILURE, payload: error, error: error, isSending: false });
const signContractRequest = () => ({ type: SIGN_CONTRACT_REQUEST });
const signContractSuccess = (contract) => ({ type: SIGN_CONTRACT_SUCCESS, payload: contract, isCompliant: true });
const signContractFailure = (error) => ({ type: SIGN_CONTRACT_FAILURE, payload: error });

// Async Action Creator (Thunk)
const fetchContract = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchContractRequest());

    const { token } = getState().auth.token;

    try {
      const contract = await fetchFromAPI(`/contracts/${id}`, token);

      dispatch(fetchContractSuccess(contract));
    } catch (error) {
      dispatch(fetchContractFailure(error));
    }
  };
};

// Async Action Creator (Thunk)
const signContract = (id) => {
  return async (dispatch, getState) => {
    dispatch(signContractRequest());
    const { token } = getState().auth;

    try {
      const contract = await patchAPI(`/settings/compliance`, {
        isCompliant: true
      }, token);
      dispatch(signContractSuccess(contract));
    } catch (error) {
      dispatch(signContractFailure(error));
    }
  };
};

const getContracts = (params = {}) => {
  return async (dispatch, getState) => {
    dispatch(getContractsRequest());

    const state = getState();
    const token = state.auth.token;

    try {
      const response = await fetch('/contracts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.contract);
      }

      const result = await response.json();

      dispatch(getContractsSuccess(result));
    } catch (error) {
      dispatch(getContractsFailure(error.contract));
    }
  };
};

const fetchContracts = getContracts;

module.exports = {
  fetchContracts,
  fetchContract,
  signContract,
  getContracts,
  FETCH_CONTRACT_REQUEST,
  FETCH_CONTRACT_SUCCESS,
  FETCH_CONTRACT_FAILURE,
  GET_CONTRACTS_REQUEST,
  GET_CONTRACTS_SUCCESS,
  GET_CONTRACTS_FAILURE,
  SIGN_CONTRACT_REQUEST,
  SIGN_CONTRACT_SUCCESS,
  SIGN_CONTRACT_FAILURE
};
