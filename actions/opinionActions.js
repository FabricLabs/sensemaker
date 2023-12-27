'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchOpinionsFromAPI (token) {
  return fetchFromAPI('/opinions', null, token);
}

// Action types
const FETCH_OPINIONS_REQUEST = 'FETCH_OPINIONS_REQUEST';
const FETCH_OPINIONS_SUCCESS = 'FETCH_OPINIONS_SUCCESS';
const FETCH_OPINIONS_FAILURE = 'FETCH_OPINIONS_FAILURE';
const FETCH_OPINION_REQUEST = 'FETCH_OPINION_REQUEST';
const FETCH_OPINION_SUCCESS = 'FETCH_OPINION_SUCCESS';
const FETCH_OPINION_FAILURE = 'FETCH_OPINION_FAILURE';

// Action creators
const fetchOpinionsRequest = () => ({ type: FETCH_OPINIONS_REQUEST, loading: true });
const fetchOpinionsSuccess = (opinions) => ({ type: FETCH_OPINIONS_SUCCESS, payload: opinions, loading: false });
const fetchOpinionsFailure = (error) => ({ type: FETCH_OPINIONS_FAILURE, payload: error, loading: false  });
const fetchOpinionRequest = () => ({ type: FETCH_OPINION_REQUEST, loading: true });
const fetchOpinionSuccess = (instance) => ({ type: FETCH_OPINION_SUCCESS, payload: instance, loading: false });
const fetchOpinionFailure = (error) => ({ type: FETCH_OPINION_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchOpinions = () => {
  return async (dispatch, getState) => {
    dispatch(fetchOpinionsRequest());
    const { token } = getState().auth;
    try {
      const opinions = await fetchOpinionsFromAPI(token);
      dispatch(fetchOpinionsSuccess(opinions));
    } catch (error) {
      dispatch(fetchOpinionsFailure(error));
    }
  };
};

const fetchOpinion = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchOpinionRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/opinions/${id}`, null, token);
      dispatch(fetchOpinionSuccess(instance));
    } catch (error) {
      dispatch(fetchOpinionFailure(error));
    }
  };
};

module.exports = {
  fetchOpinion,
  fetchOpinions,
  FETCH_OPINION_REQUEST,
  FETCH_OPINION_SUCCESS,
  FETCH_OPINION_FAILURE,
  FETCH_OPINIONS_REQUEST,
  FETCH_OPINIONS_SUCCESS,
  FETCH_OPINIONS_FAILURE
};
