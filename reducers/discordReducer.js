'use strict';

const {
  FETCH_DISCORD_STATS_REQUEST,
  FETCH_DISCORD_STATS_SUCCESS,
  FETCH_DISCORD_STATS_FAILURE,
  FETCH_DISCORD_GUILD_REQUEST,
  FETCH_DISCORD_GUILD_SUCCESS,
  FETCH_DISCORD_GUILD_FAILURE
} = require('../actions/discordActions');

const initialState = {
  error: null,
  loading: true,
  syncActive: false,
  syncStatus: '',
  guild: {},
  guilds: []
};

function discordReducer (state = initialState, action) {
  switch (action.type) {
    case FETCH_DISCORD_STATS_REQUEST:
      return { ...state }; // reset state
    case FETCH_DISCORD_STATS_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_DISCORD_STATS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case FETCH_DISCORD_GUILD_REQUEST:
      return { ...state }; // reset state
    case FETCH_DISCORD_GUILD_SUCCESS:
      return { ...state, ...action.payload, loading: false };
    case FETCH_DISCORD_GUILD_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

module.exports = discordReducer;
