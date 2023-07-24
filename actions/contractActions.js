'use strict';

// Dependencies
const fetch = require('cross-fetch');

// API Actions
const { fetchFromAPI } = require('./apiActions');

// Action Types
const FETCH_CONTRACT_REQUEST = 'FETCH_CONTRACT_REQUEST';
const FETCH_CONTRACT_SUCCESS = 'FETCH_CONTRACT_SUCCESS';
const FETCH_CONTRACT_FAILURE = 'FETCH_CONTRACT_FAILURE';
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

module.exports = {
  fetchContract,
  getContracts,
  FETCH_CONTRACT_REQUEST,
  FETCH_CONTRACT_SUCCESS,
  FETCH_CONTRACT_FAILURE,
  GET_CONTRACTS_REQUEST,
  GET_CONTRACTS_SUCCESS,
  GET_CONTRACTS_FAILURE
};
