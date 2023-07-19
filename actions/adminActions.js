// API function
async function fetchFromAPI (token) {
  const response = await fetch('/statistics/admin', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  return await response.json();
}

// Action types
const FETCH_ADMIN_STATS_REQUEST = 'FETCH_ADMIN_STATS_REQUEST';
const FETCH_ADMIN_STATS_SUCCESS = 'FETCH_ADMIN_STATS_SUCCESS';
const FETCH_ADMIN_STATS_FAILURE = 'FETCH_ADMIN_STATS_FAILURE';

// Action creators
const fetchAdminStatsRequest = () => ({ type: FETCH_ADMIN_STATS_REQUEST });
const fetchAdminStatsSuccess = (stats) => ({ type: FETCH_ADMIN_STATS_SUCCESS, payload: stats });
const fetchAdminStatsFailure = (error) => ({ type: FETCH_ADMIN_STATS_FAILURE, payload: error });

// Thunk action creator
const fetchAdminStats = () => {
  return async (dispatch, getState) => {
    dispatch(fetchAdminStatsRequest());
    const { token } = getState().auth;
    try {
      const stats = await fetchFromAPI(token);
      dispatch(fetchAdminStatsSuccess(stats));
    } catch (error) {
      dispatch(fetchAdminStatsFailure(error));
    }
  };
};

module.exports = {
  fetchAdminStats,
  FETCH_ADMIN_STATS_REQUEST,
  FETCH_ADMIN_STATS_SUCCESS,
  FETCH_ADMIN_STATS_FAILURE
};
