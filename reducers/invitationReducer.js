const {
    FETCH_INVITATION_REQUEST,
    FETCH_INVITATION_SUCCESS,
    FETCH_INVITATION_FAILURE,
    FETCH_INVITATIONS_REQUEST,
    FETCH_INVITATIONS_SUCCESS,
    FETCH_INVITATIONS_FAILURE,
    SEND_INVITATION_REQUEST,
    SEND_INVITATION_SUCCESS,
    SEND_INVITATION_FAILURE
} = require('../actions/invitationActions');

const initialState = {
    current: {},
    error: null,
    loading: true
};

function invitationReducer(state = initialState, action) {
    switch (action.type) {
        case FETCH_INVITATION_REQUEST:
            return { ...state };
        case FETCH_INVITATION_SUCCESS:
            return { ...state, current: action.payload, loading: false };
        case FETCH_INVITATION_FAILURE:
            console.debug('fetch invitation failure:', state, action);
            return { ...state, error: action.payload, loading: false };
        case FETCH_INVITATIONS_REQUEST:
            return { ...state };
        case FETCH_INVITATIONS_SUCCESS:
            return { ...state, invitations: action.payload, loading: false };
        case FETCH_INVITATIONS_FAILURE:
            console.debug('fetch invitations failure:', state, action);
            return { ...state, error: action.payload, loading: false };
        case SEND_INVITATION_REQUEST:
            return { ...state };
        case SEND_INVITATION_SUCCESS:
            return { ...state, current: action.payload };
        case SEND_INVITATION_FAILURE:
            return { ...state, error: action.payload, current: {} };
        default:
            return state;
    }
}

module.exports = invitationReducer;
