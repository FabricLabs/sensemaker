'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchVolumesFromAPI (token) {
  return fetchFromAPI('/volumes', null, token);
}

// Action types
const FETCH_VOLUMES_REQUEST = 'FETCH_VOLUMES_REQUEST';
const FETCH_VOLUMES_SUCCESS = 'FETCH_VOLUMES_SUCCESS';
const FETCH_VOLUMES_FAILURE = 'FETCH_VOLUMES_FAILURE';
const FETCH_VOLUME_REQUEST = 'FETCH_VOLUME_REQUEST';
const FETCH_VOLUME_SUCCESS = 'FETCH_VOLUME_SUCCESS';
const FETCH_VOLUME_FAILURE = 'FETCH_VOLUME_FAILURE';

// Action creators
const fetchVolumesRequest = () => ({ type: FETCH_VOLUMES_REQUEST, loading: true });
const fetchVolumesSuccess = (volumes) => ({ type: FETCH_VOLUMES_SUCCESS, payload: volumes, loading: false });
const fetchVolumesFailure = (error) => ({ type: FETCH_VOLUMES_FAILURE, payload: error, loading: false  });
const fetchVolumeRequest = () => ({ type: FETCH_VOLUME_REQUEST, loading: true });
const fetchVolumeSuccess = (instance) => ({ type: FETCH_VOLUME_SUCCESS, payload: instance, loading: false });
const fetchVolumeFailure = (error) => ({ type: FETCH_VOLUME_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchVolumes = () => {
  return async (dispatch, getState) => {
    dispatch(fetchVolumesRequest());
    const { token } = getState().auth;
    try {
      const volumes = await fetchVolumesFromAPI(token);
      dispatch(fetchVolumesSuccess(volumes));
    } catch (error) {
      dispatch(fetchVolumesFailure(error));
    }
  };
};

const fetchVolume = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchVolumeRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/volumes/${id}`, null, token);
      dispatch(fetchVolumeSuccess(instance));
    } catch (error) {
      dispatch(fetchVolumeFailure(error));
    }
  };
};

module.exports = {
  fetchVolume,
  fetchVolumes,
  FETCH_VOLUME_REQUEST,
  FETCH_VOLUME_SUCCESS,
  FETCH_VOLUME_FAILURE,
  FETCH_VOLUMES_REQUEST,
  FETCH_VOLUMES_SUCCESS,
  FETCH_VOLUMES_FAILURE
};
