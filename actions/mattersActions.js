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
      console.log("en el reducer", matter);
      if (!matter.ok) {
        const errorData = await matter.json();
        throw new Error(errorData.message || 'Server error');
      }

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

// const fetchInvitation = (id) => {
//   return async (dispatch, getState) => {
//     dispatch(fetchInvitationRequest());
//     const { token } = getState().auth;
//     try {
//       const instance = await fetchFromAPI(`/invitations/${id}`, null, token);
//       dispatch(fetchInvitationSuccess(instance));
//     } catch (error) {
//       dispatch(fetchInvitationFailure(error));
//     }
//   };
// };

// //used to send the first invitations, this will actually create the new invitation for the user, if it didn't exist
// const sendInvitation = (email) => {
//   return async (dispatch, getState) => {
//     dispatch(sendInvitationRequest());
//     const { token } = getState().auth;
//     try {
//       const timeoutPromise = new Promise((_, reject) => {
//         setTimeout(() => {
//           reject(new Error("Fetch timed out"));
//         }, 60000);
//       });

//       const fetchPromise = fetch('/invitations', {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email }),
//       });

//       const response = await Promise.race([timeoutPromise, fetchPromise]);
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Server error');
//       }

//       const data = await response.json();
//       dispatch(sendInvitationSuccess(data));
//     } catch (error) {
//       dispatch(sendInvitationFailure(error));
//     }

//   }
// }

// //re send the invitation that was created before
// const reSendInvitation = (id) => {
//   return async (dispatch, getState) => {
//     dispatch(sendInvitationRequest());
//     const { token } = getState().auth;

//     try {
//       const timeoutPromise = new Promise((_, reject) => {
//         setTimeout(() => {
//           reject(new Error("Fetch timed out"));
//         }, 60000);
//       });

//       const fetchPromise = fetch(`/invitations/${id}`, {
//         method: "PATCH",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const response = await Promise.race([timeoutPromise, fetchPromise]);
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Server error');
//       }

//       const data = await response.json();
//       dispatch(sendInvitationSuccess(data));
//     } catch (error) {
//       dispatch(sendInvitationFailure(error));
//     }

//   }
// }

// const checkInvitationToken = (invitationToken) => {
//   return async (dispatch) => {
//     dispatch(checkInvitationTokenRequest());
//     try {
//       const timeoutPromise = new Promise((_, reject) => {
//         setTimeout(() => {
//           reject(new Error("Error: Please check your internet connection"));
//         }, 15000);
//       });

//       const fetchPromise = fetch(`/checkInvitationToken/${invitationToken}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       const response = await Promise.race([timeoutPromise, fetchPromise]);
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Server error');
//       }

//       const data = await response.json();

//       dispatch(checkInvitationTokenSuccess(data));
//     } catch (error) {
//       dispatch(checkInvitationTokenFailure(error.message));
//     }
//   }
// }

// const acceptInvitation = (invitationToken) => {
//   return async dispatch => {
//     dispatch(acceptInvitationRequest());
//     try {
//       const response = await fetch(`/invitations/accept/${invitationToken}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Server error');
//       }

//       const data = await response.json();
//       dispatch(acceptInvitationSuccess(data));
//     } catch (error) {
//       console.log("Error updating invitation status:", error.message);
//       dispatch(acceptInvitationFailure(error.message));
//     }

//   }
// }

// const declineInvitation = (invitationToken) => {
//   return async dispatch => {
//     dispatch(declineInvitationRequest());
//     try {
//       const response = await fetch(`/invitations/decline/${invitationToken}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Server error');
//       }

//       const data = await response.json();
//       dispatch(declineInvitationSuccess(data));
//     } catch (error) {
//       console.log("Error updating invitation status:", error.message);
//       dispatch(declineInvitationFailure(error.message));
//     }
//   }
// }

// const deleteInvitation = (ID) => {
//   return async dispatch => {
//     dispatch(deleteInvitationRequest());
//     try {
//       const response = await fetch(`/invitations/delete/${ID}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Server error');
//       }

//       const data = await response.json();
//       dispatch(deleteInvitationSuccess(data));
//     } catch (error) {
//       console.log("Error deleting invitation:", error.message);
//       dispatch(deleteInvitationFailure(error.message));
//     }
//   }
// }


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
