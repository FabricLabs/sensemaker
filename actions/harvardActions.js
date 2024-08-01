async function fetchFromHarvard (path, token = null) {
  const response = await fetch(`https://api.case.law/v1/${path}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': (token) ? `Bearer ${token}` : undefined
    }
  });

  return await response.json();
}

module.exports = {
  fetchFromHarvard
};
