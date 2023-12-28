'use strict';

const { fetchFromAPI } = require('./apiActions');

async function fetchPeopleFromAPI (token) {
  return fetchFromAPI('/judges', null, token);
}

// Action types
const FETCH_PEOPLE_REQUEST = 'FETCH_PEOPLE_REQUEST';
const FETCH_PEOPLE_SUCCESS = 'FETCH_PEOPLE_SUCCESS';
const FETCH_PEOPLE_FAILURE = 'FETCH_PEOPLE_FAILURE';
const FETCH_PERSON_REQUEST = 'FETCH_PERSON_REQUEST';
const FETCH_PERSON_SUCCESS = 'FETCH_PERSON_SUCCESS';
const FETCH_PERSON_FAILURE = 'FETCH_PERSON_FAILURE';

// Action creators
const fetchPeopleRequest = () => ({ type: FETCH_PEOPLE_REQUEST, loading: true });
const fetchPeopleSuccess = (judges) => ({ type: FETCH_PEOPLE_SUCCESS, payload: judges, loading: false });
const fetchPeopleFailure = (error) => ({ type: FETCH_PEOPLE_FAILURE, payload: error, loading: false  });
const fetchPersonRequest = () => ({ type: FETCH_PERSON_REQUEST, loading: true });
const fetchPersonSuccess = (instance) => ({ type: FETCH_PERSON_SUCCESS, payload: instance, loading: false });
const fetchPersonFailure = (error) => ({ type: FETCH_PERSON_FAILURE, payload: error, loading: false });

// Thunk action creator
const fetchPeople = () => {
  return async (dispatch, getState) => {
    dispatch(fetchPeopleRequest());
    const { token } = getState().auth;
    try {
      const judges = await fetchPeopleFromAPI(token);
      dispatch(fetchPeopleSuccess(judges));
    } catch (error) {
      dispatch(fetchPeopleFailure(error));
    }
  };
};

const fetchPerson = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchPersonRequest());
    const { token } = getState().auth.token;
    try {
      const instance = await fetchFromAPI(`/judges/${id}`, null, token);
      dispatch(fetchPersonSuccess(instance));
    } catch (error) {
      dispatch(fetchPersonFailure(error));
    }
  };
};

module.exports = {
  fetchPerson,
  fetchPeople,
  FETCH_PERSON_REQUEST,
  FETCH_PERSON_SUCCESS,
  FETCH_PERSON_FAILURE,
  FETCH_PEOPLE_REQUEST,
  FETCH_PEOPLE_SUCCESS,
  FETCH_PEOPLE_FAILURE
};
