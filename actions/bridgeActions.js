'use strict';

const { fetchFromAPI } = require('./apiActions');

// Action types
const BRIDGE_SYNC_REQUEST = 'BRIDGE_SYNC_REQUEST';
const BRIDGE_SYNC_SUCCESS = 'BRIDGE_SYNC_SUCCESS';
const BRIDGE_SYNC_FAILURE = 'BRIDGE_SYNC_FAILURE';

// Action creators
const bridgeSyncRequest = () => ({ type: BRIDGE_SYNC_REQUEST, loading: true });
const bridgeSyncSuccess = (instance) => ({ type: BRIDGE_SYNC_SUCCESS, payload: instance, loading: false });
const bridgeSyncFailure = (error) => ({ type: BRIDGE_SYNC_FAILURE, payload: error, loading: false });

// Thunk action creator
const bridgeSync = () => {
  return async (dispatch, getState) => {
    dispatch(bridgeSyncRequest());
    const { token } = getState().auth.token;
    try {
      // TODO: get bridge instance
      const instance = await fetchFromAPI(`/`, null, token);
      dispatch(bridgeSyncSuccess(instance));
    } catch (error) {
      dispatch(bridgeSyncFailure(error));
    }
  };
};

module.exports = {
  bridgeSync,
  BRIDGE_SYNC_REQUEST,
  BRIDGE_SYNC_SUCCESS,
  BRIDGE_SYNC_FAILURE
};
