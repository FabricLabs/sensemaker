'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchMattersFromAPI(token) {
  return fetchFromAPI('/matters', null, token);
}

// Action types
const FETCH_MATTERS_REQUEST = 'FETCH_MATTERS_REQUEST';
const FETCH_MATTERS_SUCCESS = 'FETCH_MATTERS_SUCCESS';
const FETCH_MATTERS_FAILURE = 'FETCH_MATTERS_FAILURE';

const FETCH_MATTER_REQUEST = 'FETCH_MATTER_REQUEST';
const FETCH_MATTER_SUCCESS = 'FETCH_MATTER_SUCCESS';
const FETCH_MATTER_FAILURE = 'FETCH_MATTER_FAILURE';

const CREATE_MATTER_REQUEST = 'CREATE_MATTER_REQUEST';
const CREATE_MATTER_SUCCESS = 'CREATE_MATTER_SUCCESS';
const CREATE_MATTER_FAILURE = 'CREATE_MATTER_FAILURE';


// Action creators
const fetchMattersRequest = () => ({ type: FETCH_MATTERS_REQUEST });
const fetchMattersSuccess = (matters) => ({ type: FETCH_MATTERS_SUCCESS, payload: matters });
const fetchMattersFailure = (error) => ({ type: FETCH_MATTERS_FAILURE, payload: error });

const fetchMatterRequest = () => ({ type: FETCH_MATTER_REQUEST });
const fetchMatterSuccess = (matters) => ({ type: FETCH_MATTER_SUCCESS, payload: matters });
const fetchMatterFailure = (error) => ({ type: FETCH_MATTER_FAILURE, payload: error });

const createMatterRequest = () => ({ type: CREATE_MATTER_REQUEST, loading: true });
const createMatterSuccess = (response) => ({ type: CREATE_MATTER_SUCCESS, payload: response });
const createMatterFailure = (error) => ({ type: CREATE_MATTER_FAILURE, payload: error });


// Thunk action creator
const fetchMatters = () => {
  return async (dispatch, getState) => {
    dispatch(fetchMattersRequest());
    const { token } = getState().auth;
    try {
      const matters = await fetchMattersFromAPI(token);
      dispatch(fetchMattersSuccess(matters));
    } catch (error) {
      dispatch(fetchMattersFailure(error));
    }
  };
};

const fetchMatter = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchMatterRequest());
    const { token } = getState().auth;
    try {
      const matter = await fetchFromAPI(`/matter/${id}`, null, token);
      dispatch(fetchMatterSuccess(matter));
    } catch (error) {
      dispatch(fetchMatterFailure(error.message));
    }
  };
};

const createMatter = (title, description, plaintiff, defendant, representing, jurisdiction_id, court_id) => {
  return async (dispatch, getState) => {
    dispatch(createMatterRequest());
    try {
      const { token } = getState().auth;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Matter creation could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.'));
        }, 15000);
      });

      const fetchPromise = fetch('/matters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, plaintiff, defendant, representing, jurisdiction_id, court_id }),
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }
      //forced delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const data = await response.json();

      dispatch(createMatterSuccess(data));
    } catch (error) {
      dispatch(createMatterFailure(error.message));
    }

  }
}

module.exports = {
  fetchMatters,
  fetchMatter,
  createMatter,
  FETCH_MATTERS_REQUEST,
  FETCH_MATTERS_SUCCESS,
  FETCH_MATTERS_FAILURE,
  FETCH_MATTER_REQUEST,
  FETCH_MATTER_SUCCESS,
  FETCH_MATTER_FAILURE,
  CREATE_MATTER_REQUEST,
  CREATE_MATTER_SUCCESS,
  CREATE_MATTER_FAILURE,

};