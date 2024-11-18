'use strict';

const fetch = require('node-fetch');

async function fetchFromAPI (path, params = {}, token = null) {
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    }
  });

  return await response.json();
}

async function fetchResource (path = document.path) {
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    }
  });

  return response.json();
}

async function patchAPI (path, params, token = null) {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify([
      { op: 'replace', path: '/', value: params }
    ])
  });

  return await response.json();
}

async function postAPI (path, params, token = null) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    },
    body: params
  });

  return await response.json();
}

module.exports = {
  fetchFromAPI,
  fetchResource,
  patchAPI,
  postAPI
};
