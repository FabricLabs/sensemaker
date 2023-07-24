async function fetchFromAPI (path, token = null) {
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    },
  });

  return await response.json();
}

module.exports = {
  fetchFromAPI
};
