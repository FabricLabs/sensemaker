'use strict';

// Core Actions
const { fetchFromAPI } = require('./apiActions');

// Functions
// TODO: re-write to use common API methods
async function fetchStatsFromAPI (token) {
  const response = await fetch('/services/bitcoin', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchBlockFromAPI (blockhash, token) {
  const response = await fetch(`/services/bitcoin/blocks/${blockhash}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchBlocksFromAPI (token) {
  const response = await fetch(`/services/bitcoin/blocks`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchTransactionFromAPI (txhash, token) {
  const response = await fetch(`/services/bitcoin/transactions/${txhash}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

async function fetchTransactionsFromAPI (token) {
  const response = await fetch(`/services/bitcoin/transactions`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  return await response.json();
}

// Action types
const FETCH_BITCOIN_STATS_REQUEST = 'FETCH_BITCOIN_STATS_REQUEST';
const FETCH_BITCOIN_STATS_SUCCESS = 'FETCH_BITCOIN_STATS_SUCCESS';
const FETCH_BITCOIN_STATS_FAILURE = 'FETCH_BITCOIN_STATS_FAILURE';
const FETCH_BITCOIN_BLOCK_REQUEST = 'FETCH_BITCOIN_BLOCK_REQUEST';
const FETCH_BITCOIN_BLOCK_SUCCESS = 'FETCH_BITCOIN_BLOCK_SUCCESS';
const FETCH_BITCOIN_BLOCK_FAILURE = 'FETCH_BITCOIN_BLOCK_FAILURE';
const FETCH_BITCOIN_BLOCKS_REQUEST = 'FETCH_BITCOIN_BLOCKS_REQUEST';
const FETCH_BITCOIN_BLOCKS_SUCCESS = 'FETCH_BITCOIN_BLOCKS_SUCCESS';
const FETCH_BITCOIN_BLOCKS_FAILURE = 'FETCH_BITCOIN_BLOCKS_FAILURE';
const FETCH_BITCOIN_TRANSACTION_REQUEST = 'FETCH_BITCOIN_TRANSACTION_REQUEST';
const FETCH_BITCOIN_TRANSACTION_SUCCESS = 'FETCH_BITCOIN_TRANSACTION_SUCCESS';
const FETCH_BITCOIN_TRANSACTION_FAILURE = 'FETCH_BITCOIN_TRANSACTION_FAILURE';
const FETCH_BITCOIN_TRANSACTIONS_REQUEST = 'FETCH_BITCOIN_TRANSACTIONS_REQUEST';
const FETCH_BITCOIN_TRANSACTIONS_SUCCESS = 'FETCH_BITCOIN_TRANSACTIONS_SUCCESS';
const FETCH_BITCOIN_TRANSACTIONS_FAILURE = 'FETCH_BITCOIN_TRANSACTIONS_FAILURE';

// Action creators
const fetchBitcoinStatsRequest = () => ({ type: FETCH_BITCOIN_STATS_REQUEST });
const fetchBitcoinStatsSuccess = (stats) => ({ type: FETCH_BITCOIN_STATS_SUCCESS, payload: stats });
const fetchBitcoinStatsFailure = (error) => ({ type: FETCH_BITCOIN_STATS_FAILURE, payload: error });
const fetchBitcoinBlockRequest = () => ({ type: FETCH_BITCOIN_BLOCK_REQUEST });
const fetchBitcoinBlockSuccess = (block) => ({ type: FETCH_BITCOIN_BLOCK_SUCCESS, payload: block });
const fetchBitcoinBlockFailure = (error) => ({ type: FETCH_BITCOIN_BLOCK_FAILURE, payload: error });
const fetchBitcoinBlocksRequest = () => ({ type: FETCH_BITCOIN_BLOCKS_REQUEST });
const fetchBitcoinBlocksSuccess = (blocks) => ({ type: FETCH_BITCOIN_BLOCKS_SUCCESS, payload: blocks });
const fetchBitcoinBlocksFailure = (error) => ({ type: FETCH_BITCOIN_BLOCKS_FAILURE, payload: error });
const fetchBitcoinTransactionRequest = () => ({ type: FETCH_BITCOIN_TRANSACTION_REQUEST });
const fetchBitcoinTransactionSuccess = (block) => ({ type: FETCH_BITCOIN_TRANSACTION_SUCCESS, payload: block });
const fetchBitcoinTransactionFailure = (error) => ({ type: FETCH_BITCOIN_TRANSACTION_FAILURE, payload: error });
const fetchBitcoinTransactionsRequest = () => ({ type: FETCH_BITCOIN_TRANSACTIONS_REQUEST });
const fetchBitcoinTransactionsSuccess = (blocks) => ({ type: FETCH_BITCOIN_TRANSACTIONS_SUCCESS, payload: blocks });
const fetchBitcoinTransactionsFailure = (error) => ({ type: FETCH_BITCOIN_TRANSACTIONS_FAILURE, payload: error });

// Thunk action creator
const fetchBitcoinStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchBitcoinStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchStatsFromAPI(token);
      dispatch(fetchBitcoinStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchBitcoinStatsFailure(error));
    }
  };
};

const fetchBitcoinBlock = (blockhash) => {
  return async (dispatch, getState) => {
    dispatch(fetchBitcoinBlockRequest());
    const { token } = getState().auth;
    try {
      const block = await fetchBlockFromAPI(blockhash, token);
      dispatch(fetchBitcoinBlockSuccess(block));
    } catch (error) {
      dispatch(fetchBitcoinBlockFailure(error));
    }
  };
};

const fetchBitcoinBlocks = () => {
  return async (dispatch, getState) => {
    dispatch(fetchBitcoinBlocksRequest());
    const { token } = getState().auth;
    try {
      const blocks = await fetchBlocksFromAPI(token);
      dispatch(fetchBitcoinBlocksSuccess(blocks));
    } catch (error) {
      dispatch(fetchBitcoinBlocksFailure(error));
    }
  };
};

const fetchBitcoinTransaction = (txhash) => {
  return async (dispatch, getState) => {
    dispatch(fetchBitcoinTransactionRequest());
    const { token } = getState().auth;
    try {
      const block = await fetchTransactionFromAPI(txhash, token);
      dispatch(fetchBitcoinTransactionSuccess(block));
    } catch (error) {
      dispatch(fetchBitcoinTransactionFailure(error));
    }
  };
};

const fetchBitcoinTransactions = () => {
  return async (dispatch, getState) => {
    dispatch(fetchBitcoinTransactionsRequest());
    const { token } = getState().auth;
    try {
      const transactions = await fetchTransactionsFromAPI(token);
      dispatch(fetchBitcoinTransactionsSuccess(transactions));
    } catch (error) {
      dispatch(fetchBitcoinTransactionsFailure(error));
    }
  };
};

module.exports = {
  fetchBitcoinStats,
  fetchBitcoinBlock,
  fetchBitcoinBlocks,
  fetchBitcoinTransaction,
  fetchBitcoinTransactions,
  FETCH_BITCOIN_STATS_REQUEST,
  FETCH_BITCOIN_STATS_SUCCESS,
  FETCH_BITCOIN_STATS_FAILURE,
  FETCH_BITCOIN_BLOCK_REQUEST,
  FETCH_BITCOIN_BLOCK_SUCCESS,
  FETCH_BITCOIN_BLOCK_FAILURE,
  FETCH_BITCOIN_BLOCKS_REQUEST,
  FETCH_BITCOIN_BLOCKS_SUCCESS,
  FETCH_BITCOIN_BLOCKS_FAILURE,
  FETCH_BITCOIN_TRANSACTION_REQUEST,
  FETCH_BITCOIN_TRANSACTION_SUCCESS,
  FETCH_BITCOIN_TRANSACTION_FAILURE,
  FETCH_BITCOIN_TRANSACTIONS_REQUEST,
  FETCH_BITCOIN_TRANSACTIONS_SUCCESS,
  FETCH_BITCOIN_TRANSACTIONS_FAILURE
};
