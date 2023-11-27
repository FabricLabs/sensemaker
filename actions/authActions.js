'use strict';

const fetch = require('cross-fetch');

// Action Types
const LOGIN_REQUEST = 'LOGIN_REQUEST';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';
const REGISTER_REQUEST = 'REGISTER_REQUEST';
const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
const REGISTER_FAILURE = 'REGISTER_FAILURE';

// Sync Action Creators
const loginRequest = () => ({ type: LOGIN_REQUEST });
const loginSuccess = (session) => ({ type: LOGIN_SUCCESS, payload: session });
const loginFailure = error => ({ type: LOGIN_FAILURE, payload: error, error: error });
const registerRequest = () => ({ type: REGISTER_REQUEST });
const registerSuccess = token => ({ type: REGISTER_SUCCESS, payload: { token } });
const registerFailure = error => ({ type: REGISTER_FAILURE, payload: error, error: error });

const login = (username, password) => {
  return async dispatch => {
    dispatch(loginRequest());

    try {
      const response = await fetch('/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

 
      const session = await response.json();
      
      // Here we create the database and store the session
      const dbRequest = indexedDB.open("JeevesDB", 1); 
      
      dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result;
  
        if (!db.objectStoreNames.contains('token')) {
          const objectStore = db.createObjectStore('token',{ keyPath: 'id' });
          objectStore.createIndex("authToken", "authToken", { unique: false });
        }
      };
  
      dbRequest.onerror = function (event) {
        console.error('Error opening IndexedDB:', event.target.error);
      };

      dbRequest.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['token'], 'readwrite');
        const store = transaction.objectStore('token');
        store.put({ id: 'authToken', value: session.token });
      };

      dispatch(loginSuccess(session));
    } catch (error) {
      dispatch(loginFailure(error.message));
    }
  };
};


const reLogin = (token) => {
  return async dispatch => {
    try {
      const response = await fetch('/sessionRestore', {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },      
      });

      const user = await response.json();

      const session = {
        token: token,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isCompliant: user.isCompliant
      }

      if (!response.ok) {       
        const error = await response.json();
        throw new Error(error.message);
      }
      //dispatch(reLoginSuccess(respuesta,token));
        dispatch(loginSuccess(session));
    } catch (error) {   
      dispatch(loginFailure(error.message));
    }
  };
};


const register = (username, password) => {
  return async dispatch => {
    dispatch(registerRequest());

    try {
      const response = await fetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { token } = await response.json();
      dispatch(registerSuccess(token));
    } catch (error) {
      dispatch(registerFailure(error.message));
    }
  };
};

const logout = () => {
  return async dispatch => {

    const request = indexedDB.open('JeevesDB', 1);

    request.onerror = function(event) {
      console.error("IndexedDB error:", event.target.errorCode);
    };
  
    request.onsuccess = function(event) {
      const db = event.target.result;        
      const transaction = db.transaction(['token'], 'readwrite');      
      const objectStore = transaction.objectStore('token');    
     
      const deleteRequest = objectStore.delete('authToken');
  
      deleteRequest.onsuccess = function(event) {        
        console.log('The token has been removed from IndexedDB');
      };
  
      deleteRequest.onerror = function(event) {         
        console.error("IndexedDB delete error:", event.target.errorCode);
      };
    };

  }
};

module.exports = {
  login,
  register,
  reLogin,
  logout,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_REQUEST,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE
};
