const {
    FETCH_INVITATION_REQUEST,
    FETCH_INVITATION_SUCCESS,
    FETCH_INVITATION_FAILURE,
    FETCH_INVITATIONS_REQUEST,
    FETCH_INVITATIONS_SUCCESS,
    FETCH_INVITATIONS_FAILURE,
    SEND_INVITATION_REQUEST,
    SEND_INVITATION_SUCCESS,
    SEND_INVITATION_FAILURE,
    CHECK_INVITATION_TOKEN_REQUEST,
    CHECK_INVITATION_TOKEN_SUCCESS,
    CHECK_INVITATION_TOKEN_FAILURE,
} = require('../actions/invitationActions');


const initialState = {
    current: {},
    error: null,
    loading: false,
    sending: false,
    invitationValid: false,
    invitationSent: false,
};

function invitationReducer(state = initialState, action) {
    switch (action.type) {
        //actions to fetch a single invitation (not ready yet)
        case FETCH_INVITATION_REQUEST:
            return { ...state, loading: true };
        case FETCH_INVITATION_SUCCESS:
            return { ...state, current: action.payload, loading: false };
        case FETCH_INVITATION_FAILURE:
            console.debug('fetch invitation failure:', state, action);
            return { ...state, error: action.payload, loading: false };

        //actions to get the list of invitations
        case FETCH_INVITATIONS_REQUEST:
            return { ...state, loading: true };
        case FETCH_INVITATIONS_SUCCESS:
            return { ...state, invitations: action.payload, loading: false };
        case FETCH_INVITATIONS_FAILURE:
            console.debug('fetch invitations failure:', state, action);
            return { ...state, error: action.payload, loading: false };

        //actions about sending/resending invitations
        case SEND_INVITATION_REQUEST:
            return { ...state, sending: true };
        case SEND_INVITATION_SUCCESS:
            return { ...state, invitationSent: true, sending: false };
        case SEND_INVITATION_FAILURE:
            return { ...state, error: action.payload, invitationSent: false, sending: false };

        //actions for checking if the invitation token is valid
        case CHECK_INVITATION_TOKEN_REQUEST:
            return { ...state, loading: true };
        case CHECK_INVITATION_TOKEN_SUCCESS:
            return { ...state, invitationValid: true, loading: false };
        case CHECK_INVITATION_TOKEN_FAILURE:
            return { ...state, error: action.payload, invitationValid: false, loading: false };

        default:
            return state;
    }
}

module.exports = invitationReducer;
