'use strict';

const {
  FETCH_BITCOIN_STATS_REQUEST,
  FETCH_BITCOIN_STATS_SUCCESS,
  FETCH_BITCOIN_STATS_FAILURE,
  FETCH_BITCOIN_BLOCK_REQUEST,
  FETCH_BITCOIN_BLOCK_SUCCESS,
  FETCH_BITCOIN_BLOCK_FAILURE,
  FETCH_BITCOIN_BLOCKS_REQUEST,
  FETCH_BITCOIN_BLOCKS_SUCCESS,
  FETCH_BITCOIN_BLOCKS_FAILURE
} = require('../actions/bitcoinActions');

const initialState = {
  error: null,
  loading: true,
  network: 'mainnet',
  genesisHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
  blockHeight: 0,
  issuance: 0,
  block: {},
  blocks: [],
  contract: {},
  contracts: {},
  nodes: [
    { name: 'BITCOIN_LOCAL_MAINNET_WALLET', network: 'mainnet', url: 'http://localhost:8332', roles: ['wallet', 'blockchain', 'mempool'] },
    { name: 'BITCOIN_LOCAL_MAINNET_BOUNDARY', network: 'mainnet', url: 'http://localhost:8332', roles: ['blockchain', 'mempool'] },
    { name: 'BITCOIN_LOCAL_TESTNET_WALLET', network: 'testnet', url: 'http://localhost:18332', roles: ['wallet', 'blockchain', 'mempool'] },
    { name: 'BITCOIN_LOCAL_TESTNET_BOUNDARY', network: 'testnet', url: 'http://localhost:18332', roles: ['blockchain', 'mempool'] }
  ],
  supply: 0,
  syncActive: false,
  syncStatus: '',
  transaction: {},
  transactions: []
};

function bitcoinReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_BITCOIN_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_BITCOIN_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_BITCOIN_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_BITCOIN_BLOCK_REQUEST:
      return { ...state }; // reset state
    case FETCH_BITCOIN_BLOCK_SUCCESS:
      return { ...state, block: action.payload, loading: false };
    case FETCH_BITCOIN_BLOCK_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_BITCOIN_BLOCKS_REQUEST:
      return { ...state }; // reset state
    case FETCH_BITCOIN_BLOCKS_SUCCESS:
      return { ...state, blocks: action.payload, loading: false };
    case FETCH_BITCOIN_BLOCKS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = bitcoinReducer;
