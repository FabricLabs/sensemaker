async function fetchFromAPI (path, params = {},token = null) {
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    }
  });

  return await response.json();
}

async function patchAPI (path, params, token = null) {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify([
      { op: 'replace', path: '/', value: params }
    ])
  });

  return await response.json();
}

module.exports = {
  fetchFromAPI,
  patchAPI
};
