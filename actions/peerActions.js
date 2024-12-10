'use strict';

const fetch = require('cross-fetch');
const { fetchFromAPI } = require('./apiActions');

async function fetchPeersFromAPI (token) {
  // TODO: pagination
  return fetchFromAPI('/peers', null, token);
}

// Action types
const FETCH_PEERS_REQUEST = 'FETCH_PEERS_REQUEST';
const FETCH_PEERS_SUCCESS = 'FETCH_PEERS_SUCCESS';
const FETCH_PEERS_FAILURE = 'FETCH_PEERS_FAILURE';

const FETCH_PEER_REQUEST = 'FETCH_PEER_REQUEST';
const FETCH_PEER_SUCCESS = 'FETCH_PEER_SUCCESS';
const FETCH_PEER_FAILURE = 'FETCH_PEER_FAILURE';

const CREATE_PEER_REQUEST = 'CREATE_PEER_REQUEST';
const CREATE_PEER_SUCCESS = 'CREATE_PEER_SUCCESS';
const CREATE_PEER_FAILURE = 'CREATE_PEER_FAILURE';

// Action creators
const fetchPeersRequest = () => ({ type: FETCH_PEERS_REQUEST, loading: true });
const fetchPeersSuccess = (peers) => ({ type: FETCH_PEERS_SUCCESS, payload: peers, loading: false });
const fetchPeersFailure = (error) => ({ type: FETCH_PEERS_FAILURE, payload: error, loading: false });

const fetchPeerRequest = () => ({ type: FETCH_PEER_REQUEST, loading: true });
const fetchPeerSuccess = (instance) => ({ type: FETCH_PEER_SUCCESS, payload: instance, loading: false });
const fetchPeerFailure = (error) => ({ type: FETCH_PEER_FAILURE, payload: error, loading: false });

const createPeerRequest = (email) => ({ type: CREATE_PEER_REQUEST, payload: email });
const createPeerSuccess = () => ({ type: CREATE_PEER_SUCCESS });
const createPeerFailure = (error) => ({ type: CREATE_PEER_FAILURE, payload: error });

// Thunk action creator
const fetchPeers = () => {
  return async (dispatch, getState) => {
    dispatch(fetchPeersRequest());
    const { token } = getState().auth;
    try {
      const peers = await fetchPeersFromAPI(token);
      dispatch(fetchPeersSuccess(peers));
    } catch (error) {
      dispatch(fetchPeersFailure(error));
    }
  };
};

const fetchPeer = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchPeerRequest());
    const { token } = getState().auth;
    try {
      const instance = await fetchFromAPI(`/peers/${id}`, null, token);
      dispatch(fetchPeerSuccess(instance));
    } catch (error) {
      dispatch(fetchPeerFailure(error));
    }
  };
};

const createPeer = (peer) => {
  return async (dispatch, getState) => {
    dispatch(createPeerRequest(peer));
    const { token } = getState().auth;
    try {
      // call for the fetch that generates the token for password reset
      const fetchPromise = fetch('/peers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(peer),
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Could not create peer.  Please try again.'));
        }, 60000);
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      dispatch(createPeerSuccess());
    } catch (error) {
      dispatch(createPeerFailure(error));
    }
  };
}

module.exports = {
  fetchPeer,
  fetchPeers,
  createPeer,
  FETCH_PEER_REQUEST,
  FETCH_PEER_SUCCESS,
  FETCH_PEER_FAILURE,
  FETCH_PEERS_REQUEST,
  FETCH_PEERS_SUCCESS,
  FETCH_PEERS_FAILURE,
  CREATE_PEER_REQUEST,
  CREATE_PEER_SUCCESS,
  CREATE_PEER_FAILURE,
};
