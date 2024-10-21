'use strict';

const { fetchFromAPI } = require('./apiActions');


// Action types
const SEARCH_GLOBAL_REQUEST = 'SEARCH_GLOBAL_REQUEST';
const SEARCH_GLOBAL_SUCCESS = 'SEARCH_GLOBAL_SUCCESS';
const SEARCH_GLOBAL_FAILURE = 'SEARCH_GLOBAL_FAILURE';


// Action creators
const searchGlobalRequest = () => ({ type: SEARCH_GLOBAL_REQUEST });
const searchGlobalSuccess = (data) => ({ type: SEARCH_GLOBAL_SUCCESS, payload: data });
const searchGlobalFailure = (error) => ({ type: SEARCH_GLOBAL_FAILURE, payload: error });

// Thunk action creator
const searchGlobal = (query) => {
  return async (dispatch, getState) => {
    dispatch(searchGlobalRequest());
    const { token } = getState().auth;
    try {
      const fetchPromise = fetch(`/`, {
        method: 'SEARCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Fetch timed out'));
        }, 15000);
      });
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      const data = await response.json();
      dispatch(searchGlobalSuccess(data));
    } catch (error) {
      dispatch(searchGlobalFailure(error));
    }
  };
};


module.exports = {
  searchGlobal,
  SEARCH_GLOBAL_REQUEST,
  SEARCH_GLOBAL_SUCCESS,
  SEARCH_GLOBAL_FAILURE
};
