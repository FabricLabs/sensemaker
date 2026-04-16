'use strict';

const {
  FETCH_PEER_REQUEST,
  FETCH_PEER_SUCCESS,
  FETCH_PEER_FAILURE,
  FETCH_PEERS_REQUEST,
  FETCH_PEERS_SUCCESS,
  FETCH_PEERS_FAILURE,
} = require('../actions/peerActions');

const initialState = {
  peers: [],
  current: {},
  loading: false,
  error: null
};

function peersReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_PEER_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_PEER_SUCCESS:
      return { ...state, loading: false, current: action.payload };
    case FETCH_PEER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_PEERS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_PEERS_SUCCESS:
      return { ...state, loading: false, peers: Array.isArray(action.payload) ? action.payload : [] };
    case FETCH_PEERS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

module.exports = peersReducer;
