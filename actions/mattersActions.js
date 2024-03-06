'use strict';

const { fetchFromAPI } = require('./apiActions');
const createTimeoutPromise = require('../functions/createTimeoutPromise');



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

const EDIT_MATTER_REQUEST = 'EDIT_MATTER_REQUEST';
const EDIT_MATTER_SUCCESS = 'EDIT_MATTER_SUCCESS';
const EDIT_MATTER_FAILURE = 'EDIT_MATTER_FAILURE';

const ADD_CONTEXT_REQUEST = 'ADD_CONTEXT_REQUEST';
const ADD_CONTEXT_SUCCESS = 'ADD_CONTEXT_SUCCESS';
const ADD_CONTEXT_FAILURE = 'ADD_CONTEXT_FAILURE';

const REMOVE_FILE_REQUEST = 'REMOVE_FILE_REQUEST';
const REMOVE_FILE_SUCCESS = 'REMOVE_FILE_SUCCESS';
const REMOVE_FILE_FAILURE = 'REMOVE_FILE_FAILURE';

const FETCH_MATTER_FILES_REQUEST = 'FETCH_MATTER_FILES_REQUEST';
const FETCH_MATTER_FILES_SUCCESS = 'FETCH_MATTER_FILES_SUCCESS';
const FETCH_MATTER_FILES_FAILURE = 'FETCH_MATTER_FILES_FAILURE';

const FETCH_MATTER_NOTES_REQUEST = 'FETCH_MATTER_NOTES_REQUEST';
const FETCH_MATTER_NOTES_SUCCESS = 'FETCH_MATTER_NOTES_SUCCESS';
const FETCH_MATTER_NOTES_FAILURE = 'FETCH_MATTER_NOTES_FAILURE';

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

const editMatterRequest = () => ({ type: EDIT_MATTER_REQUEST, loading: true });
const editMatterSuccess = (response) => ({ type: EDIT_MATTER_SUCCESS, payload: response });
const editMatterFailure = (error) => ({ type: EDIT_MATTER_FAILURE, payload: error });

const addContextRequest = () => ({ type: ADD_CONTEXT_REQUEST, loading: true });
const addContextSuccess = (response) => ({ type: ADD_CONTEXT_SUCCESS, payload: response });
const addContextFailure = (error) => ({ type: ADD_CONTEXT_FAILURE, payload: error });

const removeFileRequest = () => ({ type: REMOVE_FILE_REQUEST, loading: true });
const removeFileSuccess = (response) => ({ type: REMOVE_FILE_SUCCESS, payload: response });
const removeFileFailure = (error) => ({ type: REMOVE_FILE_FAILURE, payload: error });

const fetchMatterFilesRequest = () => ({ type: FETCH_MATTER_FILES_REQUEST });
const fetchMatterFilesSuccess = (files) => ({ type: FETCH_MATTER_FILES_SUCCESS, payload: files });
const fetchMatterFilesFailure = (error) => ({ type: FETCH_MATTER_FILES_FAILURE, payload: error });

const fetchMatterNotesRequest = () => ({ type: FETCH_MATTER_NOTES_REQUEST });
const fetchMatterNotesSuccess = (notes) => ({ type: FETCH_MATTER_NOTES_SUCCESS, payload: notes });
const fetchMatterNotesFailure = (error) => ({ type: FETCH_MATTER_NOTES_FAILURE, payload: error });

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
      const matter = await fetchFromAPI(`/matters/${id}`, null, token);
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

      const timeoutPromise = createTimeoutPromise(15000, 'Matter creation could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.')

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


const editMatter = (id, title, description, plaintiff, defendant, representing, jurisdiction_id, court_id) => {
  return async (dispatch, getState) => {
    dispatch(editMatterRequest());
    try {
      const { token } = getState().auth;
      const timeoutPromise = createTimeoutPromise(15000, 'Matter edition could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.');

      const fetchPromise = fetch(`/matters/${id}`, {
        method: 'PATCH',
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
      dispatch(editMatterSuccess(data));
    } catch (error) {
      dispatch(editMatterFailure(error.message));
    }

  }
}


const addContext = (note, filename, id, file) => {
  console.log(note, filename, id);
  return async (dispatch, getState) => {
    dispatch(addContextRequest());
    try {
      const { token } = getState().auth;
      const timeoutPromise = createTimeoutPromise(15000, 'Matter edition could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.');

      // const promiseCreateFile = fetch(`/files`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: (() => {
      //     const formData = new FormData();
      //     formData.append('file', file);
      //     console.log(formData);
      //     return formData;
      //   })(),
      // });

      // const creatingFile = await Promise.race([timeoutPromise, promiseCreateFile]);

      // if (!response.ok) {
      //   throw new Error('File upload failed');
      // }
      // const uploadResult = await creatingFile.json();

      // console.log("respuesta a la subida del archivo", uploadResult);
      //right now im just storing the file name in this endpoint, we can save the path, or anything that could be usefull
      const fetchPromise = fetch(`/matters/context/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note, filename, id }),
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);


      dispatch(addContextSuccess(response));
    } catch (error) {
      dispatch(addContextFailure(error.message));
    }

  }
}

const removeFile = (id) => {
  return async (dispatch, getState) => {
    dispatch(removeFileRequest());
    try {
      const { token } = getState().auth;
      const timeoutPromise = createTimeoutPromise(15000, 'File deletion could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.');

      //right now im just storing the file name in this endpoint, we can save the path, or anything that could be usefull
      const fetchPromise = fetch(`/matters/removefile/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);

      dispatch(removeFileSuccess(response));
    } catch (error) {
      dispatch(removeFileFailure(error.message));
    }

  }
}

const removeNote = (id) => {
  return async (dispatch, getState) => {
    dispatch(removeFileRequest());
    try {
      const { token } = getState().auth;
      const timeoutPromise = createTimeoutPromise(15000, 'Note deletion could not be completed due to a timeout error. Please check your network connection and try again. For ongoing issues, contact our support team at support@novo.com.');

      //right now im just storing the file name in this endpoint, we can save the path, or anything that could be usefull
      const fetchPromise = fetch(`/matters/removenote/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const response = await Promise.race([timeoutPromise, fetchPromise]);

      dispatch(removeFileSuccess(response));
    } catch (error) {
      dispatch(removeFileFailure(error.message));
    }

  }
}


const fetchMatterFiles = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchMatterFilesRequest());
    const { token } = getState().auth;
    try {
      const files = await fetchFromAPI(`/matters/files/${id}`, null, token);
      dispatch(fetchMatterFilesSuccess(files));
    } catch (error) {
      dispatch(fetchMatterFilesFailure(error.message));
    }
  };
};

const fetchMatterNotes = (id) => {
  return async (dispatch, getState) => {
    dispatch(fetchMatterNotesRequest());
    const { token } = getState().auth;
    try {
      const notes = await fetchFromAPI(`/matters/notes/${id}`, null, token);
      dispatch(fetchMatterNotesSuccess(notes));
    } catch (error) {
      dispatch(fetchMatterNotesFailure(error.message));
    }
  };
};

module.exports = {
  fetchMatters,
  fetchMatter,
  createMatter,
  addContext,
  removeFile,
  removeNote,
  editMatter,
  fetchMatterFiles,
  fetchMatterNotes,
  FETCH_MATTERS_REQUEST,
  FETCH_MATTERS_SUCCESS,
  FETCH_MATTERS_FAILURE,
  FETCH_MATTER_REQUEST,
  FETCH_MATTER_SUCCESS,
  FETCH_MATTER_FAILURE,
  CREATE_MATTER_REQUEST,
  CREATE_MATTER_SUCCESS,
  CREATE_MATTER_FAILURE,
  EDIT_MATTER_REQUEST,
  EDIT_MATTER_SUCCESS,
  EDIT_MATTER_FAILURE,
  ADD_CONTEXT_REQUEST,
  ADD_CONTEXT_SUCCESS,
  ADD_CONTEXT_FAILURE,
  REMOVE_FILE_REQUEST,
  REMOVE_FILE_SUCCESS,
  REMOVE_FILE_FAILURE,
  FETCH_MATTER_FILES_REQUEST,
  FETCH_MATTER_FILES_SUCCESS,
  FETCH_MATTER_FILES_FAILURE,
  FETCH_MATTER_NOTES_REQUEST,
  FETCH_MATTER_NOTES_SUCCESS,
  FETCH_MATTER_NOTES_FAILURE,
};