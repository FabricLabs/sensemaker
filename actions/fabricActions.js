'use strict';

// Dependencies
const crypto = require('crypto');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Functions
const _sortKeys = require('@fabric/core/functions/_sortKeys');

// Action types
const GENERATE_ACTOR_ID_REQUEST = 'GENERATE_ACTOR_ID_REQUEST';
const GENERATE_ACTOR_ID_SUCCESS = 'GENERATE_ACTOR_ID_SUCCESS';
const GENERATE_ACTOR_ID_FAILURE = 'GENERATE_ACTOR_ID_FAILURE';

// Action creators
const generateActorRequest = () => ({ type: GENERATE_ACTOR_ID_REQUEST });
const generateActorSuccess = (id) => ({ type: GENERATE_ACTOR_ID_SUCCESS, payload: id });
const generateActorFailure = (error) => ({ type: GENERATE_ACTOR_ID_FAILURE, payload: error });

// Thunk action creator
const generateActor = (state) => {
  return async (dispatch, getState) => {
    dispatch(generateActorRequest());
    const { token } = getState().auth;

    try {
      // Fabric IDs
      const sorted = _sortKeys(state);
      const actor = new Actor(sorted);
      const json = JSON.stringify({ type: 'FabricActorState', object: sorted }, null, '  ');
      const hash = crypto.createHash('sha256').update(json, 'utf8').digest('hex');

      console.debug('[FABRIC:SEED]', 'Actor:', actor.id);
      console.debug('[FABRIC:SEED]', 'JSON:', json.id);
      console.debug('[FABRIC:SEED]', 'SHA256:', hash);

      dispatch(generateActorSuccess(actor.id));
    } catch (error) {
      dispatch(generateActorFailure(error));
    }
  };
};

module.exports = {
  generateActor,
  GENERATE_ACTOR_ID_REQUEST,
  GENERATE_ACTOR_ID_SUCCESS,
  GENERATE_ACTOR_ID_FAILURE
};
