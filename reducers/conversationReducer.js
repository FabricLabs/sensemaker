'use strict';

const conversationsReducer = (state = [], action) => {
  switch(action.type) {
    case 'FETCH_CONVERSATIONS':
      return action.payload;
    default:
      return state;
  }
};

export default conversationsReducer;
